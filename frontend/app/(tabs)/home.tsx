import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { Search, LocateFixed, Navigation2, MapPin, CircleDot, X, Play, CheckCircle2, CarTaxiFront } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuthStore } from '../../src/store/authStore';
import { useLocationStore } from '../../src/store/locationStore';
import { useRideStore } from '../../src/store/rideStore';
import MapContainer from '../../src/components/MapContainer';
import RideRequestModal from '../../src/components/RideRequestModal';
import IncomingRideModal from '../../src/components/IncomingRideModal';
import DestinationSearch from '../../src/components/DestinationSearch';
import { fetchRoute, LatLng, calculatePrice } from '../../src/utils/fetchRoute';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/config/theme';
type Region = { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
const { width } = Dimensions.get('window');
const DEFAULT_REGION: Region = {
  latitude: 43.3313,
  longitude: 21.8925,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};
export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const isDriver = user?.role === 'DRIVER';
  const { location, nearbyDrivers, startWatching, errorMsg } = useLocationStore();
  const {
    currentRide,
    incomingRequest,
    driverLocation,
    listen,
    unlisten,
    acceptRide,
    cancelRide,
    startRide,
    completeRide,
    clearRide,
    setIncomingRequest,
  } = useRideStore();
  const mapRef = useRef<any>(null);
  const hasCenteredOnUser = useRef(false);
  const [showRideModal, setShowRideModal] = useState(false);
  const [searchMode, setSearchMode] = useState<'pickup' | 'destination' | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [destLabel, setDestLabel] = useState<string | null>(null);
  const [pickup, setPickup] = useState<{ lat: number; lng: number } | null>(null);
  const [pickupLabel, setPickupLabel] = useState<string>('My location');
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
  const [driverRouteCoordinates, setDriverRouteCoordinates] = useState<LatLng[]>([]);
  const [ridePrice, setRidePrice] = useState<number | undefined>(undefined);
  const [rideDistanceKm, setRideDistanceKm] = useState<number | undefined>(undefined);
  const [tracking, setTracking] = useState(false); 
  const [nearPickup, setNearPickup] = useState(false); 
  const [nearDestination, setNearDestination] = useState(false); 
  const [rideActionLoading, setRideActionLoading] = useState(false);
  const rideActive = !!(currentRide && currentRide.status !== 'COMPLETED' && currentRide.status !== 'CANCELLED');
  const rideInProgress = currentRide?.status === 'IN_PROGRESS';
  useEffect(() => {
    startWatching();
    listen();
    return () => unlisten();
  }, []);
  useEffect(() => {
    if (!location || hasCenteredOnUser.current) return;
    if (Platform.OS === 'web' || !mapRef.current?.animateToRegion) return;
    hasCenteredOnUser.current = true;
    mapRef.current.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      },
      600,
    );
  }, [location]);  
  useEffect(() => {    
    const origin = pickup || (location ? { lat: location.latitude, lng: location.longitude } : null);
    if (!origin || !destination) {
      setRouteCoordinates([]);
      setRidePrice(undefined);
      setRideDistanceKm(undefined);
      return;
    }
    let cancelled = false;
    fetchRoute(
      { latitude: origin.lat, longitude: origin.lng },
      destination,
    ).then((result) => {
      if (!cancelled) {
        setRouteCoordinates(result.coordinates);
        if (result.distanceMeters > 0) {
          const km = result.distanceMeters / 1000;
          setRideDistanceKm(km);
          setRidePrice(calculatePrice(result.distanceMeters));
        }        
        if (result.coordinates.length > 1 && mapRef.current?.fitToCoordinates && Platform.OS !== 'web') {
          mapRef.current.fitToCoordinates(result.coordinates, {
            edgePadding: { top: 120, right: 60, bottom: 200, left: 60 },
            animated: true,
          });
        }
      }
    });
    return () => { cancelled = true; };
  }, [destination, pickup, location?.latitude, location?.longitude]);  
  const distanceBetween = (
    a: { lat: number; lng: number },
    b: { lat: number; lng: number },
  ) => {
    const R = 6371000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const sinLat = Math.sin(dLat / 2);
    const sinLng = Math.sin(dLng / 2);
    const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  };  
  useEffect(() => {
    if (!isDriver || !currentRide || !location) return;
    if (currentRide.status === 'COMPLETED' || currentRide.status === 'CANCELLED') return;
    let cancelled = false;
    const dest =
      currentRide.status === 'IN_PROGRESS'
        ? { lat: currentRide.destinationLat, lng: currentRide.destinationLng }
        : { lat: currentRide.pickupLat, lng: currentRide.pickupLng };
    fetchRoute(
      { latitude: location.latitude, longitude: location.longitude },
      dest,
    ).then((result) => {
      if (!cancelled) {
        setDriverRouteCoordinates(result.coordinates);
        if (result.coordinates.length > 1 && mapRef.current?.fitToCoordinates && Platform.OS !== 'web') {
          mapRef.current.fitToCoordinates(result.coordinates, {
            edgePadding: { top: 120, right: 60, bottom: 200, left: 60 },
            animated: true,
          });
        }
      }
    });
    return () => { cancelled = true; };
  }, [isDriver, currentRide?.id, currentRide?.status, location?.latitude, location?.longitude]);  
  useEffect(() => {
    if (!isDriver || !currentRide || !location) return;
    const driverPos = { lat: location.latitude, lng: location.longitude };
    const PROXIMITY_THRESHOLD = 150; 
    if (currentRide.status === 'ACCEPTED') {
      const pickupPos = { lat: currentRide.pickupLat, lng: currentRide.pickupLng };
      const dist = distanceBetween(driverPos, pickupPos);
      setNearPickup(dist < PROXIMITY_THRESHOLD);
      setNearDestination(false);
    } else if (currentRide.status === 'IN_PROGRESS') {
      const destPos = { lat: currentRide.destinationLat, lng: currentRide.destinationLng };
      const dist = distanceBetween(driverPos, destPos);
      setNearDestination(dist < PROXIMITY_THRESHOLD);
      setNearPickup(false);
    } else {
      setNearPickup(false);
      setNearDestination(false);
    }
  }, [isDriver, currentRide?.status, location?.latitude, location?.longitude]);
  useEffect(() => {
    if (isDriver || !tracking || !rideInProgress || !driverLocation) return;
    if (Platform.OS === 'web' || !mapRef.current?.animateToRegion) return;
    mapRef.current.animateToRegion(
      {
        latitude: driverLocation.lat,
        longitude: driverLocation.lng,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      },
      600,
    );
  }, [driverLocation?.lat, driverLocation?.lng, rideInProgress, tracking]);  
  const handleStartRide = async () => {
    if (!currentRide) return;
    setRideActionLoading(true);
    try {
      await startRide(currentRide.id);
      setNearPickup(false);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not start ride');
    } finally {
      setRideActionLoading(false);
    }
  };  
  const handleCompleteRide = async () => {
    if (!currentRide) return;
    setRideActionLoading(true);
    try {
      await completeRide(currentRide.id);
      setNearDestination(false);
      setDriverRouteCoordinates([]);
      Alert.alert('Ride Completed', 'The ride has been completed successfully.');
      clearRide();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not complete ride');
    } finally {
      setRideActionLoading(false);
    }
  };
  const region: Region = location
    ? {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }
    : DEFAULT_REGION;
  const centerOnUser = () => {
    if (location && Platform.OS !== 'web' && mapRef.current?.animateToRegion) {
      mapRef.current.animateToRegion(
        {
          ...location,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        },
        400,
      );
    }
  };  
  const handleMapPress = (e: any) => {
    if (isDriver) return;
    if (rideActive) return;
    if (Platform.OS === 'web' || !e.nativeEvent?.coordinate) return;
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setDestination({ lat: latitude, lng: longitude });
    setDestLabel(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
  };  
  const handleConfirmDestination = () => {
    const origin = pickup || (location ? { lat: location.latitude, lng: location.longitude } : null);
    if (!origin || !destination) return;
    setShowRideModal(true);
  };  
  const handleAcceptRide = async () => {
    if (!incomingRequest) return;
    setAcceptLoading(true);
    try {
      await acceptRide(incomingRequest.rideId);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not accept ride');
    } finally {
      setAcceptLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      {}
      <MapContainer
        ref={mapRef}
        region={region}
        location={location}
        pickup={pickup ? { latitude: pickup.lat, longitude: pickup.lng } : null}
        isDriver={isDriver}
        nearbyDrivers={nearbyDrivers}
        destination={destination}
        driverLocation={driverLocation}
        currentRide={currentRide}
        routeCoordinates={routeCoordinates}
        driverRouteCoordinates={driverRouteCoordinates}
        onPress={handleMapPress}
      />
      {}
      <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.topBar}>
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greeting}>
              Hello, {user?.firstName || 'there'}
            </Text>
            <Text style={styles.greetingSub}>
              {isDriver ? 'Ready to drive?' : 'Where are you going?'}
            </Text>
          </View>
        </View>
        {!isDriver && !rideActive && (
          <TouchableOpacity style={styles.searchBar} activeOpacity={0.7} onPress={() => setSearchMode('destination')}>
            <Search size={18} color={Colors.textSecondary} />
            <Text style={styles.searchPlaceholder}>{destLabel || 'Search destination'}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
      {}
      <TouchableOpacity style={styles.locateBtn} onPress={centerOnUser} activeOpacity={0.8}>
        <LocateFixed size={20} color={Colors.primary} />
      </TouchableOpacity>
      {}
      {destination && !isDriver && !showRideModal && !tracking && (
        <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.bottomCard}>
          {}
          <TouchableOpacity
            style={styles.routeRow}
            activeOpacity={0.7}
            onPress={() => setSearchMode('pickup')}
          >
            <CircleDot size={16} color="#007AFF" />
            <View style={styles.routeTexts}>
              <Text style={styles.routeLabel}>PICKUP</Text>
              <Text style={styles.routeValue} numberOfLines={1}>{pickupLabel}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.routeLine} />
          {}
          <TouchableOpacity
            style={styles.routeRow}
            activeOpacity={0.7}
            onPress={() => setSearchMode('destination')}
          >
            <MapPin size={16} color={Colors.secondary} />
            <View style={styles.routeTexts}>
              <Text style={styles.routeLabel}>DESTINATION</Text>
              <Text style={styles.routeValue} numberOfLines={1}>
                {destLabel || `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`}
              </Text>
            </View>
          </TouchableOpacity>
          {}
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirmDestination}
            activeOpacity={0.8}
          >
            <Navigation2 size={18} color="#fff" />
            <Text style={styles.confirmText}>Request Ride</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      {}
      {(pickup || location) && destination && (
        <RideRequestModal
          visible={showRideModal}
          onClose={() => {
            setShowRideModal(false);
            setDestination(null);
            setDestLabel(null);
            setPickup(null);
            setPickupLabel('My location');
            setRouteCoordinates([]);
            setRidePrice(undefined);
            setRideDistanceKm(undefined);
            clearRide();
          }}
          onDriverMatched={() => {            
            setShowRideModal(false);
            setTracking(true);
          }}
          pickupLat={pickup?.lat ?? location!.latitude}
          pickupLng={pickup?.lng ?? location!.longitude}
          destLat={destination.lat}
          destLng={destination.lng}
          pickupLabel={pickupLabel}
          destLabel={destLabel || undefined}
          price={ridePrice}
          distanceKm={rideDistanceKm}
        />
      )}
      {}
      {tracking && !isDriver && (
        <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.trackingCard}>
          <View style={styles.trackingHeader}>
            <CarTaxiFront size={20} color={Colors.secondary} />
            <Text style={styles.trackingTitle}>
              {currentRide?.status === 'IN_PROGRESS'
                ? 'Ride in progress'
                : currentRide?.status === 'COMPLETED'
                ? 'Ride completed!'
                : 'Driver is on the way'}
            </Text>
            {currentRide?.status !== 'IN_PROGRESS' && (
              <TouchableOpacity
                onPress={async () => {
                  if (currentRide) {
                    try { await cancelRide(currentRide.id); } catch {}
                  }
                  setTracking(false);
                  setDestination(null);
                  setDestLabel(null);
                  setPickup(null);
                  setPickupLabel('My location');
                  setRouteCoordinates([]);
                  clearRide();
                }}
                hitSlop={12}
              >
                <X size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          {ridePrice && (
            <Text style={styles.trackingPrice}>{ridePrice} RSD</Text>
          )}
          {driverLocation && (
            <Text style={styles.trackingSubtext}>
              Driver at {driverLocation.lat.toFixed(4)}, {driverLocation.lng.toFixed(4)}
            </Text>
          )}
          {!driverLocation && (
            <Text style={styles.trackingSubtext}>Waiting for driver location...</Text>
          )}
        </Animated.View>
      )}
      {}
      <IncomingRideModal
        visible={!!incomingRequest}
        onClose={() => setIncomingRequest(null)}
        ride={incomingRequest}
        onAccept={handleAcceptRide}
        loading={acceptLoading}
      />
      {}
      {isDriver && currentRide && currentRide.status !== 'COMPLETED' && currentRide.status !== 'CANCELLED' && (
        <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.driverActionCard}>
          {currentRide.status === 'ACCEPTED' && !nearPickup && (
            <>
              <View style={styles.trackingHeader}>
                <CarTaxiFront size={20} color={Colors.secondary} />
                <Text style={styles.trackingTitle}>Heading to pickup</Text>
              </View>
              <Text style={styles.trackingSubtext}>
                Drive to the rider's pickup location
              </Text>
            </>
          )}
          {currentRide.status === 'ACCEPTED' && nearPickup && (
            <>
              <View style={styles.trackingHeader}>
                <Play size={20} color={Colors.success} />
                <Text style={styles.trackingTitle}>You've arrived!</Text>
              </View>
              <Text style={styles.trackingSubtext}>
                You're near the rider. Start the ride when ready.
              </Text>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: Colors.success }]}
                onPress={handleStartRide}
                activeOpacity={0.8}
                disabled={rideActionLoading}
              >
                <Play size={18} color="#fff" />
                <Text style={[styles.confirmText, { color: '#fff' }]}>
                  {rideActionLoading ? 'Starting...' : 'Start Ride'}
                </Text>
              </TouchableOpacity>
            </>
          )}
          {currentRide.status === 'IN_PROGRESS' && !nearDestination && (
            <>
              <View style={styles.trackingHeader}>
                <Navigation2 size={20} color={Colors.secondary} />
                <Text style={styles.trackingTitle}>Ride in progress</Text>
              </View>
              <Text style={styles.trackingSubtext}>
                Heading to the destination
              </Text>
            </>
          )}
          {currentRide.status === 'IN_PROGRESS' && nearDestination && (
            <>
              <View style={styles.trackingHeader}>
                <CheckCircle2 size={20} color={Colors.success} />
                <Text style={styles.trackingTitle}>Almost there!</Text>
              </View>
              <Text style={styles.trackingSubtext}>
                You're near the destination. Complete the ride.
              </Text>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: Colors.primary }]}
                onPress={handleCompleteRide}
                activeOpacity={0.8}
                disabled={rideActionLoading}
              >
                <CheckCircle2 size={18} color="#fff" />
                <Text style={[styles.confirmText, { color: '#fff' }]}>
                  {rideActionLoading ? 'Completing...' : 'Complete Ride'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      )}
      {}
      <DestinationSearch
        visible={searchMode !== null}
        onClose={() => setSearchMode(null)}
        onSelect={({ lat, lng, label }) => {
          if (searchMode === 'pickup') {
            setPickup({ lat, lng });
            setPickupLabel(label);
          } else {
            setDestination({ lat, lng });
            setDestLabel(label);
          }
          setSearchMode(null);
        }}
        userLat={location?.latitude}
        userLng={location?.longitude}
        title={searchMode === 'pickup' ? 'Where from?' : 'Where to?'}
        placeholder={searchMode === 'pickup' ? 'Search pickup location' : 'Search destination'}
      />
      {}
      {errorMsg && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 44,
    left: Spacing.md,
    right: Spacing.md,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  greeting: {
    ...Typography.title2,
    color: Colors.text,
  },
  greetingSub: {
    ...Typography.subhead,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  searchPlaceholder: {
    ...Typography.callout,
    color: Colors.textSecondary,
  },
  locateBtn: {
    position: 'absolute',
    bottom: 140,
    right: Spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    ...Shadows.modal,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  routeTexts: {
    flex: 1,
  },
  routeLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    fontSize: 10,
  },
  routeValue: {
    ...Typography.subhead,
    color: Colors.text,
    marginTop: 1,
  },
  routeLine: {
    width: 1,
    height: 14,
    backgroundColor: Colors.border,
    marginLeft: 7.5,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  confirmText: {
    ...Typography.headline,
    color: Colors.primary,
    fontSize: 15,
  },
  errorBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.secondaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  errorText: {
    ...Typography.footnote,
    color: Colors.error,
  },
  trackingCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    ...Shadows.modal,
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  trackingTitle: {
    ...Typography.headline,
    color: Colors.text,
    flex: 1,
  },
  trackingPrice: {
    ...Typography.headline,
    color: Colors.text,
    fontSize: 18,
    marginTop: Spacing.sm,
  },
  trackingSubtext: {
    ...Typography.footnote,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  driverActionCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    ...Shadows.modal,
  },
});
