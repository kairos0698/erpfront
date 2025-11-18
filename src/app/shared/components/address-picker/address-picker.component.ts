import { Component, EventEmitter, Input, Output, OnInit, ViewChild, ElementRef, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { environment } from '../../../../environments/environment';

export interface AddressData {
  street: string;
  externalNumber: string;
  internalNumber?: string;
  neighborhood: string;
  municipality: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
}

@Component({
  selector: 'app-address-picker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    GoogleMapsModule,
    InputTextModule,
    ButtonModule,
    DialogModule
  ],
  templateUrl: './address-picker.component.html',
  styleUrls: ['./address-picker.component.scss']
})
export class AddressPickerComponent implements OnInit {
  // Propiedad interna, no @Input() para evitar problemas de detección de cambios
  address: AddressData = {
    street: '',
    externalNumber: '',
    internalNumber: '',
    neighborhood: '',
    municipality: '',
    state: '',
    postalCode: '',
    country: 'México'
  };

  @Output() addressSelected = new EventEmitter<AddressData>();
  @Output() cancel = new EventEmitter<void>();

  @ViewChild('searchInput') searchInput!: ElementRef;

  dialogVisible: boolean = false;
  autocomplete: google.maps.places.Autocomplete | null = null;
  map: google.maps.Map | null = null;
  marker: google.maps.Marker | null = null;
  
  mapOptions: google.maps.MapOptions = {
    center: { lat: 19.4326, lng: -99.1332 }, // Ciudad de México por defecto
    zoom: 13,
    mapTypeControl: true,
    streetViewControl: true,
    fullscreenControl: true,
    clickableIcons: true,
    draggable: true
  };

  mapCenter: google.maps.LatLngLiteral = { lat: 19.4326, lng: -99.1332 };
  mapZoom: number = 13;
  markerPosition: google.maps.LatLngLiteral | null = null;
  isLoadingAddress: boolean = false;
  isSearching: boolean = false;
  
  get markerOptions(): google.maps.MarkerOptions {
    const options: google.maps.MarkerOptions = {
      draggable: false,
      animation: undefined
    };

    // Solo agregar el icono si Google Maps está disponible
    if (typeof google !== 'undefined' && google.maps && google.maps.Size) {
      options.icon = {
        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
        scaledSize: new google.maps.Size(40, 40)
      };
    } else {
      // Icono simple como fallback
      options.icon = {
        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
      };
    }

    return options;
  }

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadGoogleMapsScript();
  }

  loadGoogleMapsScript(): void {
    // La API se carga mediante el script tag que necesita la API key
    // Verificar si ya está cargada
    if (typeof google !== 'undefined' && google.maps && google.maps.places) {
      return;
    }

    // Cargar el script con la API key
    const apiKey = environment.googleMapsApiKey;
    if (!apiKey || apiKey === 'TU_API_KEY_DE_GOOGLE_MAPS') {
      console.warn('Google Maps API Key no configurada. Por favor, agrega tu API key en environment.ts');
      return;
    }

    // Verificar si el script ya está en el DOM
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      // Esperar a que el script cargue si está presente pero aún no está disponible
      const checkInterval = setInterval(() => {
        if (typeof google !== 'undefined' && google.maps && google.maps.places) {
          clearInterval(checkInterval);
        }
      }, 100);
      return;
    }

    // Crear y cargar el script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google Maps API cargada correctamente');
    };
    script.onerror = () => {
      console.error('Error al cargar Google Maps API');
    };
    document.head.appendChild(script);
  }

  initAutocomplete(): void {
    // Limpiar autocomplete anterior si existe
    if (this.autocomplete) {
      google.maps.event.clearInstanceListeners(this.autocomplete);
      this.autocomplete = null;
    }

    if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
      console.error('Google Maps Places API no está cargada');
      return;
    }

    // Esperar a que el input esté en el DOM
    setTimeout(() => {
      const input = this.searchInput?.nativeElement;
      if (input && !this.autocomplete) {
        try {
          this.autocomplete = new google.maps.places.Autocomplete(input, {
            componentRestrictions: { country: 'mx' }, // Limitar a México
            fields: ['address_components', 'geometry', 'formatted_address'],
            types: ['address']
          });

          this.autocomplete.addListener('place_changed', () => {
            this.ngZone.run(() => {
              this.onPlaceSelected();
            });
          });

          console.log('Autocomplete inicializado correctamente');
        } catch (error) {
          console.error('Error al inicializar autocomplete:', error);
        }
      }
    }, 500);
  }

  onPlaceSelected(): void {
    if (!this.autocomplete) return;

    const place = this.autocomplete.getPlace();
    if (!place.geometry || !place.address_components) {
      console.warn('No se encontró información de la dirección');
      return;
    }

    // Extraer información de address_components
    const addressData: AddressData = {
      street: '',
      externalNumber: '',
      internalNumber: '',
      neighborhood: '',
      municipality: '',
      state: '',
      postalCode: '',
      country: 'México',
      latitude: place.geometry.location?.lat(),
      longitude: place.geometry.location?.lng(),
      formattedAddress: place.formatted_address || ''
    };

    // Procesar componentes de dirección (Places API usa un tipo diferente)
    place.address_components.forEach((component: any) => {
      const types = component.types;

      if (types.includes('street_number')) {
        addressData.externalNumber = component.long_name || '';
      } else if (types.includes('route')) {
        addressData.street = component.long_name || '';
      } else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
        addressData.neighborhood = component.long_name || '';
      } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        addressData.municipality = component.long_name || '';
      } else if (types.includes('administrative_area_level_1')) {
        addressData.state = component.long_name || '';
      } else if (types.includes('postal_code')) {
        addressData.postalCode = component.long_name || '';
      } else if (types.includes('country')) {
        addressData.country = component.long_name || '';
      }
    });

    // Actualizar el mapa
    if (place.geometry.location) {
      const location = place.geometry.location;
      const lat = location.lat();
      const lng = location.lng();

      this.mapCenter = { lat, lng };
      this.mapZoom = 16; // Zoom más cercano cuando se selecciona una dirección
      this.markerPosition = { lat, lng };
    }

    // Actualizar el modelo - reemplazar el objeto completo
    this.address = {
      street: addressData.street,
      externalNumber: addressData.externalNumber,
      internalNumber: addressData.internalNumber || '',
      neighborhood: addressData.neighborhood,
      municipality: addressData.municipality,
      state: addressData.state,
      postalCode: addressData.postalCode,
      country: addressData.country,
      latitude: addressData.latitude,
      longitude: addressData.longitude,
      formattedAddress: addressData.formattedAddress
    };
    
    // Forzar detección de cambios usando markForCheck para inputs
    this.cdr.markForCheck();
    // También forzar detección inmediata
    this.cdr.detectChanges();
    
    // El marcador ya se actualizó arriba, no duplicar
    // Esperar un tick para asegurar que los cambios se propaguen
    setTimeout(() => {
      console.log('Address actualizado desde autocomplete después de tick:', this.address);
    }, 0);
  }

  onMapReady(event: any): void {
    // El evento puede ser un Map directamente o un evento con la propiedad map
    const map = event instanceof google.maps.Map ? event : (event.map || event);
    this.map = map;

    // Si ya hay una posición del marcador, actualizarla
    if (this.markerPosition && this.map) {
      this.updateMarkerOnMap(this.markerPosition.lat, this.markerPosition.lng);
    }
  }

  onMapClick(event: google.maps.MapMouseEvent | any): void {
    // Manejar el evento de clic del mapa de Angular
    if (!event || !event.latLng) {
      console.warn('Evento de clic sin latLng');
      return;
    }

    // Prevenir múltiples clics rápidos
    if (this.isLoadingAddress) {
      return;
    }

    const latLng = event.latLng;
    const lat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
    const lng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;

    console.log('Clic en mapa:', lat, lng);

    // Actualizar posición del marcador UNA SOLA VEZ
    this.markerPosition = { lat, lng };
    this.isLoadingAddress = true;

    // Geocodificar la ubicación
    if (typeof google !== 'undefined' && google.maps && google.maps.Geocoder) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        this.ngZone.run(() => {
          this.isLoadingAddress = false;
          
          if (status === 'OK' && results && results[0]) {
            console.log('Geocodificación exitosa:', results[0]);
            this.parseAddressFromResult(results[0], lat, lng);
          } else {
            console.warn('Error en geocodificación:', status);
            // Si no hay resultados, al menos actualizar las coordenadas
            this.address.latitude = lat;
            this.address.longitude = lng;
            this.address.formattedAddress = `Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            this.cdr.markForCheck();
            this.cdr.detectChanges();
          }
        });
      });
    } else {
      this.isLoadingAddress = false;
      console.error('Geocoder no disponible');
    }
  }

  updateMarkerOnMap(lat: number, lng: number): void {
    if (this.marker) {
      this.marker.setPosition({ lat, lng });
    }
  }

  parseAddressFromResult(place: google.maps.GeocoderResult, lat: number, lng: number): void {
    if (!place || !place.address_components) {
      console.warn('No hay componentes de dirección');
      return;
    }

    console.log('Parseando dirección:', place);

    // Crear un nuevo objeto para forzar la detección de cambios
    const addressData: AddressData = {
      street: '',
      externalNumber: '',
      internalNumber: '',
      neighborhood: '',
      municipality: '',
      state: '',
      postalCode: '',
      country: 'México',
      latitude: lat,
      longitude: lng,
      formattedAddress: place.formatted_address || ''
    };

    // Geocoder API usa GeocoderAddressComponent con long_name
    place.address_components.forEach((component: any) => {
      const types = component.types;

      if (types.includes('street_number')) {
        addressData.externalNumber = component.long_name || '';
      } else if (types.includes('route')) {
        addressData.street = component.long_name || '';
      } else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
        if (!addressData.neighborhood) {
          addressData.neighborhood = component.long_name || '';
        }
      } else if (types.includes('locality')) {
        addressData.municipality = component.long_name || '';
      } else if (types.includes('administrative_area_level_2')) {
        if (!addressData.municipality) {
          addressData.municipality = component.long_name || '';
        }
      } else if (types.includes('administrative_area_level_1')) {
        addressData.state = component.long_name || '';
      } else if (types.includes('postal_code')) {
        addressData.postalCode = component.long_name || '';
      } else if (types.includes('country')) {
        addressData.country = component.long_name || '';
      }
    });

    console.log('Dirección parseada:', addressData);

    // Actualizar el objeto address completamente para forzar la detección de cambios
    // Reemplazar el objeto completo en lugar de modificar propiedades individuales
    this.address = {
      street: addressData.street,
      externalNumber: addressData.externalNumber,
      internalNumber: addressData.internalNumber || '',
      neighborhood: addressData.neighborhood,
      municipality: addressData.municipality,
      state: addressData.state,
      postalCode: addressData.postalCode,
      country: addressData.country,
      latitude: addressData.latitude,
      longitude: addressData.longitude,
      formattedAddress: addressData.formattedAddress
    };
    
    // Forzar detección de cambios usando markForCheck para inputs
    this.cdr.markForCheck();
    // También forzar detección inmediata
    this.cdr.detectChanges();
    
    // Actualizar mapa solo si es necesario
    if (!this.markerPosition || this.markerPosition.lat !== lat || this.markerPosition.lng !== lng) {
      this.markerPosition = { lat, lng };
      this.mapCenter = { lat, lng };
      this.mapZoom = 16; // Zoom más cercano cuando se selecciona una ubicación
    }
    
    // Esperar un tick para asegurar que los cambios se propaguen
    setTimeout(() => {
      console.log('Address actualizado después de tick:', this.address);
    }, 0);
  }

  openDialog(): void {
    // Resetear el objeto address cada vez que se abre el diálogo
    this.address = {
      street: '',
      externalNumber: '',
      internalNumber: '',
      neighborhood: '',
      municipality: '',
      state: '',
      postalCode: '',
      country: 'México'
    };
    
    this.dialogVisible = true;
    this.isLoadingAddress = false;
    this.markerPosition = null;
    
    // Forzar detección de cambios al abrir el diálogo
    this.cdr.markForCheck();
    
    // Inicializar autocomplete después de que el diálogo esté visible
    // Usar un timeout más largo para asegurar que el DOM esté listo
    setTimeout(() => {
      this.initAutocomplete();
    }, 500);
  }

  closeDialog(): void {
    this.dialogVisible = false;
  }

  saveAddress(): void {
    if (this.address.street && this.address.postalCode) {
      this.addressSelected.emit(this.address);
      this.dialogVisible = false;
    }
  }

  cancelSelection(): void {
    this.cancel.emit();
    this.dialogVisible = false;
  }

  searchAddress(): void {
    const searchValue = this.searchInput?.nativeElement?.value?.trim();
    if (!searchValue) {
      return;
    }

    if (typeof google === 'undefined' || !google.maps || !google.maps.Geocoder) {
      console.error('Google Maps Geocoder no está disponible');
      return;
    }

    this.isSearching = true;
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ 
      address: searchValue,
      region: 'mx' // Priorizar resultados de México
    }, (results, status) => {
      this.ngZone.run(() => {
        this.isSearching = false;

        if (status === 'OK' && results && results.length > 0) {
          const result = results[0];
          const location = result.geometry.location;
          const lat = location.lat();
          const lng = location.lng();

          // Actualizar el mapa y marcador
          this.mapCenter = { lat, lng };
          this.mapZoom = 16;
          this.markerPosition = { lat, lng };

          // Parsear y actualizar la dirección
          this.parseAddressFromResult(result, lat, lng);
        } else {
          console.warn('No se encontraron resultados para la búsqueda:', status);
          // Opcional: mostrar un mensaje al usuario
        }
      });
    });
  }
}

