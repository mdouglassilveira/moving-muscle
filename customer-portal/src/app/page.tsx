import { BookingProvider } from "@/components/booking/BookingProvider";
import { MapsConfigProvider } from "@/components/booking/MapsConfig";
import { WizardShell } from "@/components/booking/WizardShell";

export default function HomePage() {
  const mapsKey = process.env.GOOGLE_MAPS_API_KEY ?? "";
  return (
    <MapsConfigProvider apiKey={mapsKey}>
      <BookingProvider>
        <WizardShell />
      </BookingProvider>
    </MapsConfigProvider>
  );
}
