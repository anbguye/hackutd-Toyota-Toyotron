"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CarCard } from "@/app/api/chat/tools";

type CarRecommendationsProps = {
  items: CarCard[];
};

function formatPrice(msrp: number | null, invoice: number | null): string {
  const price = msrp ?? invoice;
  if (!price) return "Price TBD";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatMPG(city: number | null, highway: number | null, combined: number | null): string {
  if (city && highway) {
    return `${city}/${highway} MPG`;
  }
  if (combined) {
    return `${combined} MPG`;
  }
  return "MPG TBD";
}

function buildCarName(car: CarCard): string {
  const parts = [car.make, car.model, car.trim].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" ");
  }
  return car.description || "Toyota Vehicle";
}

function CarCard({ car, horizontal = false }: { car: CarCard; horizontal?: boolean }) {
  const carName = buildCarName(car);
  const price = formatPrice(car.msrp, car.invoice);
  const mpg = formatMPG(car.city_mpg, car.highway_mpg, car.combined_mpg);
  const imageUrl = car.image_url || "/placeholder.svg";

  return (
    <Link href={`/car/${car.trim_id}`} className="group relative">
      <article className={`flex h-full flex-col overflow-hidden rounded-lg border border-border/70 bg-card/80 shadow-[0_12px_24px_-18px_rgba(15,20,26,0.7)] transition-transform duration-300 hover:-translate-y-0.5 ${horizontal ? "lg:flex-row" : ""}`}>
        <div className={`relative ${horizontal ? "lg:w-1/2" : ""}`}>
          <div className={`relative aspect-[5/3] overflow-hidden bg-background/50 ${horizontal ? "lg:h-full lg:aspect-auto" : ""}`}>
            <div className="absolute inset-0 scale-110">
            <Image
              src={imageUrl}
              alt={carName}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes={horizontal ? "(min-width: 1024px) 50vw, 100vw" : "100vw"}
                style={{ objectPosition: "center 25%" }}
            />
            </div>
          </div>
          <div className="absolute left-1.5 top-1.5 flex gap-1">
            {car.model_year && (
              <Badge className="rounded-full border-border/70 bg-background/90 px-1 py-0.5 text-xs font-semibold uppercase tracking-[0.1em] text-secondary">
                {car.model_year}
              </Badge>
            )}
          </div>
        </div>
        <div className={`flex flex-1 flex-col gap-1.5 p-2.5 ${horizontal ? "lg:w-1/2" : ""}`}>
          <div className="space-y-0.5">
            <h3 className="text-xs font-semibold text-secondary leading-tight">{carName}</h3>
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground leading-tight">
              {car.body_type || "Vehicle"} • {car.body_seats ? `${car.body_seats} seats` : "Seating TBD"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-1.5 rounded-md border border-border/70 bg-background/80 p-1.5 text-xs">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground leading-tight">Starting</p>
              <p className="text-xs font-semibold text-secondary leading-tight">{price}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground leading-tight">MPG</p>
              <p className="text-xs font-semibold text-secondary leading-tight">{mpg}</p>
            </div>
          </div>
          {car.drive_type && (
            <p className="text-xs text-muted-foreground leading-tight line-clamp-2">
              {car.drive_type}
              {car.transmission ? ` • ${car.transmission}` : ""}
              {car.fuel_type ? ` • ${car.fuel_type}` : ""}
            </p>
          )}
          <Button className={`mt-auto w-full rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold h-7 ${horizontal ? "lg:w-auto" : ""}`}>
            View details <ArrowRight className="ml-1 h-2.5 w-2.5" />
          </Button>
        </div>
      </article>
    </Link>
  );
}

export function CarRecommendations({ items }: CarRecommendationsProps) {
  if (!items || items.length === 0) {
    return null;
  }

  // Single item: horizontal layout on large screens
  if (items.length === 1) {
    return (
      <div className="w-full">
        <CarCard car={items[0]} horizontal={true} />
      </div>
    );
  }

  // Two items: side-by-side with vertical card layout (image on top, content below)
  if (items.length === 2) {
    return (
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {items.map((car) => (
          <CarCard key={car.trim_id} car={car} horizontal={false} />
        ))}
      </div>
    );
  }

  // Three items: horizontal row with vertical card layout
  if (items.length === 3) {
    return (
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {items.map((car) => (
          <CarCard key={car.trim_id} car={car} horizontal={false} />
        ))}
      </div>
    );
  }

  // Four or more items: grid layout
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2">
      {items.map((car) => (
        <CarCard key={car.trim_id} car={car} />
      ))}
    </div>
  );
}

