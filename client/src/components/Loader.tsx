type LoaderProps = {
  className?: string;
  fullScreen?: boolean;
};

const segments = Array.from({ length: 9 });

export default function Loader({ className = "", fullScreen = false }: LoaderProps) {
  const wrapperClassName = fullScreen
    ? `flex min-h-screen items-center justify-center ${className}`.trim()
    : `flex items-center justify-center ${className}`.trim();

  return (
    <div className={wrapperClassName}>
      <div className="loader" role="status" aria-label="Loading">
        {segments.map((_, index) => (
          <div key={index} className="text">
            <span>LOADING</span>
          </div>
        ))}
        <div className="line" />
      </div>
    </div>
  );
}