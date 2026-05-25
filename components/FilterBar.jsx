'use client';

export default function FilterBar({ items, filterCat, filterME, onChange }) {
  const cats = ['all', ...Array.from(new Set(items.map(i => i.category).filter(Boolean))).sort()];
  const quadrants = ['all', 'Star', 'Plow Horse', 'Puzzle', 'Dog'];
  const labels = { all: 'All quadrants', Star: '⭐ Star', 'Plow Horse': '🐴 Plow Horse', Puzzle: '🧩 Puzzle', Dog: '🐶 Dog' };

  return (
    <div className="tab-filter-bar">
      <div className="tab-filter-group">
        <label>Category</label>
        <select
          className="tab-filter-select"
          value={filterCat}
          onChange={e => onChange({ cat: e.target.value, me: filterME })}
        >
          {cats.map(c => <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>)}
        </select>
      </div>
      <div className="tab-filter-group">
        <label>ME Quadrant</label>
        <select
          className="tab-filter-select"
          value={filterME}
          onChange={e => onChange({ cat: filterCat, me: e.target.value })}
        >
          {quadrants.map(q => <option key={q} value={q}>{labels[q]}</option>)}
        </select>
      </div>
    </div>
  );
}
