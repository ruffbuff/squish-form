"use client";

type RandomHistoryProps<T> = {
  items: { id: string; label: string; thumb: string }[];
  onPick: (index: number) => void;
  limit?: number;
};

/**
 * Fixed 5x2 shelf. Empty slots are drawn as dashed wells instead of leaving a
 * ragged second row, so the block always looks settled.
 */
export function RandomHistory<T>({ items, onPick, limit = 10 }: RandomHistoryProps<T>) {
  const slots = Math.max(limit, items.length);

  return (
    <div className="random-history-wrap">
      <p className="random-history__label">История</p>
      <div className="random-history" role="list" aria-label="История случайных генераций">
        {Array.from({ length: slots }, (_, index) => {
          const item = items[index];
          if (!item) {
            return (
              <span
                key={`empty-${index}`}
                className="random-history__slot random-history__slot--empty"
                role="listitem"
                aria-hidden="true"
              />
            );
          }
          return (
            <button
              key={item.id}
              type="button"
              className="random-history__slot"
              title={item.label}
              aria-label={item.label}
              onClick={() => onPick(index)}
            >
              {item.thumb ? (
                item.thumb.startsWith("data:") ? (
                  <img src={item.thumb} alt="" className="random-history__thumb-img" />
                ) : (
                  <span className="random-history__thumb" dangerouslySetInnerHTML={{ __html: item.thumb }} />
                )
              ) : (
                <span className="random-history__pending" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
