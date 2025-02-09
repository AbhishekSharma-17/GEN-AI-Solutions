export default function Card({ children, className = '' }) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-md ${className}`}>
        {children}
      </div>
    );
  }