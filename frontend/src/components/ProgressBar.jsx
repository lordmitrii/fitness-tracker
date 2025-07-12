const ProgressBar = ({ completed, total }) => {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div
      className="bg-blue-500 h-2 sm:h-3 transition-all duration-900"
      style={{ width: `${percent}%` }}
    />
  );
};

export default ProgressBar;
