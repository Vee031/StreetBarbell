"use client";

import Image from "next/image";
import { useState } from "react";

// Dominant product picture with a mini gallery of thumbnails underneath.
// The first image is the official render; the rest are admin uploads.
export function ProductGallery({ images, alt, code }: { images: string[]; alt: string; code: string }) {
  const [selected, setSelected] = useState(0);
  const current = images[Math.min(selected, images.length - 1)];
  return (
    <div className="product-gallery">
      <div className="product-detail-image">
        <Image key={current} src={current} alt={alt} fill priority sizes="(max-width: 900px) 100vw, 50vw" />
        <span className="image-code">{code}</span>
      </div>
      {images.length > 1 ? (
        <div className="product-thumbs">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              className={index === selected ? "active" : ""}
              onClick={() => setSelected(index)}
              aria-label={`${alt} — photo ${index + 1}`}
            >
              <Image src={src} alt="" fill sizes="120px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
