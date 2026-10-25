"use client";

type RandomHistoryProps<T> = {
  items: { id: string; label: string; thumb: string }[];
  onPick: (index: number) => void;
};

export function RandomHistory<T>({ items, onPick }: RandomHistoryProps<T>) {
  if (items.length === 0) return null;

  return (
    <div className="random-history" role="list" aria-label="История случайных генераций">
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          className="random-history__item"
          title={item.label}
          aria-label={item.label}
          onClick={() => onPick(index)}
        >
          {item.thumb.startsWith("data:") ? (
            <img src={item.thumb} alt="" className="random-history__thumb-img" />
          ) : (
            <span className="random-history__thumb" dangerouslySetInnerHTML={{ __html: item.thumb }} />
          )}
        </button>
      ))}
    </div>
  );
}
