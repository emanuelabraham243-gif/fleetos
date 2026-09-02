"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import { VEHICLE_OPERATIONAL_STATUS_LABEL } from "@/lib/i18n/labels";
import type { GpsStatus } from "@/lib/gps/status";
import { cn } from "@/lib/utils";

export interface FleetMapVehicle {
  id: string;
  unitNumber: string;
  latitude: number | null;
  longitude: number | null;
  gpsStatus: GpsStatus;
  freshnessLabel: string;
  speedKph: number | null;
  ignitionOn: boolean | null;
  operationalStatus: "ON_TRIP" | "AVAILABLE" | "MAINTENANCE" | "OFFLINE";
  driverName: string | null;
  tripLabel: string | null;
}

const STATUS_COLOR: Record<GpsStatus, string> = {
  live: "var(--status-live)",
  delayed: "var(--status-delayed)",
  offline: "var(--status-offline)",
  unknown: "var(--status-unknown)",
};

function vehicleIcon(status: GpsStatus, isSelected: boolean) {
  const size = isSelected ? 22 : 16;
  return L.divIcon({
    className: "",
    html: `<span style="
      display:block;
      width:${size}px;
      height:${size}px;
      border-radius:9999px;
      background:${STATUS_COLOR[status]};
      border:2px solid white;
      box-shadow:0 1px 3px rgba(0,0,0,0.4);
    "></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function FleetMap({ vehicles }: { vehicles: FleetMapVehicle[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const located = useMemo(
    () => vehicles.filter((v): v is FleetMapVehicle & { latitude: number; longitude: number } =>
      v.latitude !== null && v.longitude !== null,
    ),
    [vehicles],
  );

  const center = useMemo((): [number, number] => {
    if (located.length === 0) return [39.75, -104.99];
    const lat = located.reduce((sum, v) => sum + v.latitude, 0) / located.length;
    const lng = located.reduce((sum, v) => sum + v.longitude, 0) / located.length;
    return [lat, lng];
  }, [located]);

  if (located.length === 0) {
    return (
      <div className="flex h-full min-h-80 flex-col items-center justify-center gap-2 text-center">
        <p className="text-muted-foreground text-sm">GPS data unavailable.</p>
        <p className="text-muted-foreground max-w-sm text-xs">
          No vehicle currently has a GPS fix to plot on the map.
        </p>
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={11}
      scrollWheelZoom={false}
      className="h-full min-h-80 w-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {located.map((vehicle) => (
        <Marker
          key={vehicle.id}
          position={[vehicle.latitude, vehicle.longitude]}
          icon={vehicleIcon(vehicle.gpsStatus, selectedId === vehicle.id)}
          eventHandlers={{ click: () => setSelectedId(vehicle.id) }}
        >
          <Popup minWidth={220}>
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-semibold">Unit {vehicle.unitNumber}</span>
              <span className={cn("text-xs", "text-muted-foreground")}>
                {VEHICLE_OPERATIONAL_STATUS_LABEL[vehicle.operationalStatus]}
              </span>
              <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs">
                <dt className="text-muted-foreground">Driver</dt>
                <dd>{vehicle.driverName ?? "Unassigned"}</dd>
                <dt className="text-muted-foreground">Trip</dt>
                <dd>{vehicle.tripLabel ?? "None"}</dd>
                <dt className="text-muted-foreground">Speed</dt>
                <dd>{vehicle.speedKph !== null ? `${vehicle.speedKph} km/h` : "—"}</dd>
                <dt className="text-muted-foreground">Ignition</dt>
                <dd>{vehicle.ignitionOn === null ? "—" : vehicle.ignitionOn ? "ON" : "OFF"}</dd>
                <dt className="text-muted-foreground">GPS</dt>
                <dd>{vehicle.gpsStatus.toUpperCase()}</dd>
                <dt className="text-muted-foreground">Last update</dt>
                <dd>{vehicle.freshnessLabel}</dd>
              </dl>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
