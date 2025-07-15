const ProgressBar = ({ completed, total }) => {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div
      className="bg-blue-500 transition-all duration-900 h-full w-full"
      style={{ width: `${percent}%` }}
    />
  );
};

export default ProgressBar;
