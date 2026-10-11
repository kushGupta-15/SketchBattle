import { Tooltip } from "antd";
import { BiMinus, BiPlus } from "react-icons/bi";
import { LuEraser, LuTrash2, LuPencil, LuPaintBucket, LuUndo2 } from "react-icons/lu";

interface DrawingToolsProps {
  currentColor: string;
  currentStroke: number;
  toolMode: "brush" | "fill" | "eraser";
  setToolMode: (mode: "brush" | "fill" | "eraser") => void;
  handleColorChange: (color: string) => void;
  handleStrokeChange: (stroke: number) => void;
  clearCanvas: () => void;
  undo: () => void;
}

const PALETTE = [
  "#000000", // Black
  "#ffffff", // White
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Yellow
  "#f97316", // Orange
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#78350f", // Brown
  "#6b7280", // Gray
  "#06b6d4", // Cyan
];

const DrawingTools = ({
  currentColor,
  currentStroke,
  toolMode,
  setToolMode,
  handleColorChange,
  handleStrokeChange,
  clearCanvas,
  undo,
}: DrawingToolsProps) => {
  const handleStrokePlus = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleStrokeChange(Math.min(currentStroke + 2, 24));
  };

  const handleStrokeMinus = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleStrokeChange(Math.max(currentStroke - 2, 2));
  };

  return (
    <div className="w-14 bg-white shadow-lg rounded-2xl p-2 flex flex-col items-center gap-3 border border-gray-100">
      {/* Mode Selectors */}
      <div className="flex flex-col gap-1 w-full items-center">
        <Tooltip title="Brush Tool" placement="right">
          <button
            type="button"
            onClick={() => setToolMode("brush")}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              toolMode === "brush"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <LuPencil className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip title="Paint Bucket (Flood Fill)" placement="right">
          <button
            type="button"
            onClick={() => setToolMode("fill")}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              toolMode === "fill"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <LuPaintBucket className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip title="Eraser" placement="right">
          <button
            type="button"
            onClick={() => setToolMode("eraser")}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              toolMode === "eraser"
                ? "bg-red-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <LuEraser className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip title="Undo (Ctrl+Z)" placement="right">
          <button
            type="button"
            onClick={undo}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
          >
            <LuUndo2 className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip title="Clear Canvas" placement="right">
          <button
            type="button"
            onClick={clearCanvas}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 transition-all"
          >
            <LuTrash2 className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      <div className="w-full h-px bg-gray-200" />

      {/* Colors Grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {PALETTE.map((color) => (
          <button
            key={color}
            onClick={() => {
              handleColorChange(color);
              if (toolMode === "eraser") setToolMode("brush");
            }}
            className={`w-5 h-5 rounded-full border transition-all ${
              currentColor === color && toolMode !== "eraser"
                ? "ring-2 ring-blue-500 scale-110 border-white shadow-sm"
                : "border-gray-300 hover:scale-105"
            }`}
            style={{ backgroundColor: color }}
            type="button"
          />
        ))}
      </div>

      <div className="w-full h-px bg-gray-200" />

      {/* Brush Size */}
      <div className="flex flex-col items-center">
        <div className="text-[10px] font-semibold text-gray-500 mb-1">
          {currentStroke}px
        </div>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={handleStrokePlus}
            className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center text-xs"
          >
            <BiPlus />
          </button>
          <button
            type="button"
            onClick={handleStrokeMinus}
            className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center text-xs"
          >
            <BiMinus />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrawingTools;
