"use client";

import Image from "next/image";
import { useState } from "react";

const fallbackPositions = ["50% 50%", "24% 50%", "76% 50%", "50% 24%"];

function createGalleryItems(images: string[]) {
  const uniqueImages = images.filter((image, index) => image && images.indexOf(image) === index);
  const items = uniqueImages.map((src) => ({ src, position: "50% 50%" }));

  for (let index = items.length; index < 4; index += 1) {
    items.push({
      src: uniqueImages[index % uniqueImages.length],
      position: fallbackPositions[index],
    });
  }

  return items;
}

export function ProductGallery({ images, name, imageLabel }: { images: string[]; name: string; imageLabel: string }) {
  const items = createGalleryItems(images);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = items[selectedIndex];

  return (
    <div className="grid gap-3 md:grid-cols-[82px_minmax(0,1fr)] md:items-start">
      <div className="order-2 -mx-2 flex gap-2 overflow-x-auto px-2 py-2 md:order-1 md:mx-0 md:max-h-[680px] md:flex-col md:overflow-y-auto md:px-1">
        {items.map((item, index) => {
          const label = `${imageLabel} ${index + 1}`;
          const isSelected = index === selectedIndex;
          return (
            <button
              key={`${item.src}-${item.position}-${index}`}
              type="button"
              aria-label={label}
              aria-pressed={isSelected}
              title={label}
              data-gallery-thumbnail={index}
              onClick={() => setSelectedIndex(index)}
              className={`product-gallery-thumbnail relative z-0 size-16 shrink-0 cursor-pointer overflow-hidden rounded-[4px] border-2 bg-[#eeeef0] hover:z-10 md:size-auto md:aspect-square md:w-[72px] ${isSelected ? "border-[var(--foreground)]" : "border-transparent hover:border-[#a7aaa6]"}`}
            >
              <Image src={item.src} alt="" fill sizes="76px" className="object-cover" style={{ objectPosition: item.position }} />
            </button>
          );
        })}
      </div>

      <div className="order-1 md:order-2">
        <div className="relative aspect-square overflow-hidden rounded-[6px] bg-[#eeeef0]" data-gallery-main={selectedIndex}>
          <Image
            key={`${selected.src}-${selected.position}`}
            src={selected.src}
            alt={`${name} - ${imageLabel} ${selectedIndex + 1}`}
            fill
            priority={selectedIndex === 0}
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="product-gallery-main-image object-cover"
            style={{ objectPosition: selected.position }}
          />
          <span className="absolute bottom-3 right-3 rounded-[3px] bg-black/70 px-2 py-1 text-[11px] font-bold text-white">
            {selectedIndex + 1} / {items.length}
          </span>
        </div>
      </div>
    </div>
  );
}
