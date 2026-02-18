import React, { forwardRef } from 'react';
import { StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Polyline, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import UserMarker from './UserMarker';
import DriverMarker from './DriverMarker';
import PulsingDriverMarker from './PulsingDriverMarker';
import { Colors } from '../config/theme';
export type MapLocation = { latitude: number; longitude: number };
export type NearbyDriver = { id: string; latitude: number; longitude: number; heading: number };
export type CurrentRide = {
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
};
interface MapContainerProps {
  region: Region;
  location: MapLocation | null;
  pickup: MapLocation | null;
  isDriver: boolean;
  nearbyDrivers: NearbyDriver[];
  destination: { lat: number; lng: number } | null;
  driverLocation: { lat: number; lng: number } | null;
  currentRide: CurrentRide | null;
  routeCoordinates: { latitude: number; longitude: number }[];  
  driverRouteCoordinates?: { latitude: number; longitude: number }[];
  onPress: (e: any) => void;
}
const MapContainer = forwardRef<MapView, MapContainerProps>(
  ({ region, location, pickup, isDriver, nearbyDrivers, destination, driverLocation, currentRide, routeCoordinates, driverRouteCoordinates, onPress }, ref) => {
    return (
      <MapView
        ref={ref}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        onPress={onPress}
        mapType="standard"
        userInterfaceStyle="light"
      >
        {}
        {location && (
          <Marker
            coordinate={location}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={true}
          >
            <UserMarker />
          </Marker>
        )}
        {}
        {!isDriver &&
          nearbyDrivers.map((d) => (
            <Marker
              key={d.id}
              coordinate={{ latitude: d.latitude, longitude: d.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              rotation={d.heading}
            >
              <DriverMarker />
            </Marker>
          ))}
        {}
        {pickup && (
          <Marker
            coordinate={pickup}
            pinColor="#007AFF"
            title="Pickup"
          />
        )}
        {}
        {destination && !isDriver && (
          <Marker
            coordinate={{ latitude: destination.lat, longitude: destination.lng }}
            pinColor={Colors.secondary}
          />
        )}
        {}
        {driverLocation && !isDriver && (
          <Marker
            coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={true}
          >
            <PulsingDriverMarker />
          </Marker>
        )}
        {}
        {isDriver && currentRide && (
          <>
            <Marker
              coordinate={{
                latitude: currentRide.pickupLat,
                longitude: currentRide.pickupLng,
              }}
              pinColor={Colors.primary}
              title="Pickup"
            />
            <Marker
              coordinate={{
                latitude: currentRide.destinationLat,
                longitude: currentRide.destinationLng,
              }}
              pinColor={Colors.secondary}
              title="Destination"
            />
          </>
        )}
        {}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={Colors.secondary}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}
        {}
        {driverRouteCoordinates && driverRouteCoordinates.length > 1 && (
          <Polyline
            coordinates={driverRouteCoordinates}
            strokeColor={Colors.primary}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
            lineDashPattern={[10, 6]}
          />
        )}
      </MapView>
    );
  },
);
MapContainer.displayName = 'MapContainer';
export default MapContainer;
