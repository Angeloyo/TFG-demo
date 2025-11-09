interface TooltipProps {
  visible: boolean;
  x: number;
  y: number;
  children: React.ReactNode;
}

export default function ChartTooltip({ visible, x, y, children }: TooltipProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed pointer-events-none z-50 transition-opacity duration-200"
      style={{
        left: x + 10,
        top: y - 10,
      }}
    >
      <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-xs border border-gray-700">
        {children}
      </div>
    </div>
  );
} 