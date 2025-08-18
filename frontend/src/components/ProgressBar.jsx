const ProgressBar = ({ completed, total }) => {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div
      className="bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-900 h-full w-full"
      style={{ width: `${percent}%` }}
    />
  );
};

export default ProgressBar;
