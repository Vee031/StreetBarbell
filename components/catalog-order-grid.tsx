"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import { saveProductOrder } from "@/app/system/catalog/actions";

// One catalogue section (line or combination group) with drag & drop ordering.
// Drag cards into place; a "Save order" button appears once the sequence
// changed and persists it (the public pages follow the saved order).
export type OrderItem = {
  code: string;
  slug: string;
  name: string;
  image: string;
  enabled: boolean;
  custom?: boolean;
};

export function CatalogOrderGrid({ category, items }: { category: string; items: OrderItem[] }) {
  const [order, setOrder] = useState(items);
  const [dirty, setDirty] = useState(false);
  const dragIndex = useRef<number | null>(null);

  const move = (from: number, to: number) => {
    setOrder((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDirty(true);
  };

  return (
    <>
      {dirty && (
        <form action={saveProductOrder} className="order-save">
          <input type="hidden" name="category" value={category} />
          <input type="hidden" name="codes" value={order.map((item) => item.code).join("|")} />
          <button type="submit" className="button button-red button-small">Save order</button>
          <small>The new sequence is not live yet — save to publish it.</small>
        </form>
      )}
      <div className="cat-grid">
        {order.map((product, index) => (
          <div
            key={product.code}
            className="cat-card-wrap"
            draggable
            onDragStart={(event) => {
              dragIndex.current = index;
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", product.code);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              if (dragIndex.current !== null && dragIndex.current !== index) {
                move(dragIndex.current, index);
                dragIndex.current = index;
              }
            }}
            onDrop={(event) => event.preventDefault()}
            onDragEnd={() => {
              dragIndex.current = null;
            }}
          >
            <Link href={`/system/catalog/${product.slug}`} className={product.enabled ? "cat-card" : "cat-card is-off"} draggable={false}>
              <span className={product.enabled ? "cat-badge" : "cat-badge off"}>{product.enabled ? "On" : "Off"}</span>
              {product.custom && <span className="cat-badge custom">Custom</span>}
              <span className="cat-drag-handle" aria-hidden="true"><GripVertical size={15} /></span>
              <div className="cat-card-image">
                <Image src={product.image} alt={product.name} fill sizes="220px" draggable={false} />
              </div>
              <div className="cat-card-body">
                <small>{product.code}</small>
                <strong>{product.name}</strong>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
