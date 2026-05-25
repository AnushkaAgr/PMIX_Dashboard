'use client';

const PAGE_SIZE = 25;

export { PAGE_SIZE };

export default function Pagination({ total, page, onPage }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  const start = page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, total);
  return (
    <div className="pagination">
      <span>{total === 0 ? '0 of 0' : `${start}–${end} of ${total}`}</span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button disabled={page === 0} onClick={() => onPage(page - 1)}>← Prev</button>
        <button disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>Next →</button>
      </div>
    </div>
  );
}
