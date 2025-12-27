export default function SearchBar() {
  return (
    <input
      type="text"
      placeholder="Search product..."
      className="
        w-full
        rounded-lg
        border
        border-gray-300
        px-4
        py-2
        focus:border-black
        focus:outline-none
      "
    />
  );
}
