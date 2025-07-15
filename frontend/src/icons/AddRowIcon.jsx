const AddRowAboveIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-6 text-gray-500"
  >
    {/* Plus sign */}
    <path d="M12 2v6" />
    <path d="M9 5h6" />
    {/* Table rows */}
    <rect width="13" height="4" x="5.5" y="10" rx="1" />
    <rect width="13" height="4" x="5.5" y="16" rx="1" />
  </svg>
);

const AddRowBelowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-6 text-gray-500"
  >
    {/* Table rows */}
    <rect width="13" height="4" x="5.5" y="5" rx="1" />
    <rect width="13" height="4" x="5.5" y="11" rx="1" />
    {/* Plus sign */}
    <path d="M12 17v6" />
    <path d="M9 20h6" />
  </svg>
);

export { AddRowAboveIcon, AddRowBelowIcon };