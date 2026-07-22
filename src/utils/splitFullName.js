// Shared by every place that collects a single "Full Name" field but the
// customers table stores first_name/last_name separately (CustomerList's
// create/edit form, POS's Quick Customer) — one implementation so the two
// never drift.
//
// A single-word name (very common for walk-in customers — "Kulwa", "Frank")
// must leave lastName as an empty string, NOT duplicate firstName into it —
// an earlier version fell back to `|| firstName` here specifically to
// satisfy a backend notEmpty() validator on lastName, which is exactly what
// caused every single-word name to save (and then display) as "Kulwa
// Kulwa". The validator was relaxed to allow an empty lastName instead of
// working around it here.
export function splitFullName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
}
