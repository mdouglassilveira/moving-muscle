"use client";

import { Loader } from "@googlemaps/js-api-loader";
import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMapsKey } from "./MapsConfig";
import type { AddressInput } from "@/lib/schemas/booking";
import { Input } from "@/components/ui/Input";

interface AddressAutocompleteProps {
  value: string;
  onSelect: (parsed: Omit<AddressInput, "role">) => void;
  onTextChange?: (text: string) => void;
  placeholder?: string;
}

let loaderPromise: Promise<typeof google> | null = null;

function getLoader(apiKey: string) {
  if (!loaderPromise) {
    loaderPromise = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["places"]
    }).load();
  }
  return loaderPromise;
}

export function AddressAutocomplete({
  value,
  onSelect,
  onTextChange,
  placeholder = "Start typing your service address..."
}: AddressAutocompleteProps) {
  const apiKey = useMapsKey();
  const inputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey) {
      setError("Maps API key not configured");
      return;
    }
    let cancelled = false;
    getLoader(apiKey)
      .then((google) => {
        if (cancelled || !inputRef.current) return;
        const ac = new google.maps.places.Autocomplete(inputRef.current, {
          types: ["address"],
          componentRestrictions: { country: "us" },
          fields: ["address_components", "formatted_address", "geometry"]
        });
        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          const parsed = parsePlace(place);
          if (parsed) onSelect(parsed);
        });
        setReady(true);
      })
      .catch((err) => {
        console.error("[maps] failed to load", err);
        setError("Failed to load Google Maps");
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey, onSelect]);

  return (
    <div>
      <Input
        ref={inputRef}
        icon={<MapPin className="w-4 h-4" />}
        defaultValue={value}
        onChange={(e) => onTextChange?.(e.target.value)}
        placeholder={ready ? placeholder : "Loading address search..."}
        disabled={!ready && !error}
      />
      {error && (
        <p className="text-[12px] text-red-600 mt-1.5">
          {error}. You can still type the address manually.
        </p>
      )}
    </div>
  );
}

function parsePlace(
  place: google.maps.places.PlaceResult
): Omit<AddressInput, "role"> | null {
  if (!place.formatted_address) return null;

  const parts: Record<string, string> = {};
  for (const c of place.address_components ?? []) {
    for (const t of c.types) parts[t] = c.short_name;
  }

  const streetNumber = parts["street_number"] ?? "";
  const route = parts["route"] ?? "";
  const street = [streetNumber, route].filter(Boolean).join(" ").trim() || undefined;
  const city = parts["locality"] ?? parts["sublocality"] ?? parts["postal_town"] ?? undefined;
  const state = parts["administrative_area_level_1"] ?? undefined;
  const zip = parts["postal_code"] ?? undefined;
  const cityCode = city
    ? `${city.toUpperCase().replace(/\s+/g, "_")}_${state ?? ""}`.replace(/_$/, "")
    : undefined;

  return {
    formatted: place.formatted_address,
    street,
    city,
    state,
    zip,
    city_code: cityCode,
    lat: place.geometry?.location?.lat(),
    lng: place.geometry?.location?.lng()
  };
}
