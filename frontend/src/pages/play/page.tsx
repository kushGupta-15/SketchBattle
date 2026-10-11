import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Slider, Button, Progress, Card } from "antd";
import Navbar from "../../components/play/navbar";
import PlayerList from "../../components/play/playerList";
import WordSelectModal from "../../components/play/modals/wordSelectModal";
import RoundResultModal from "../../components/play/modals/roundResultModal";
import GameEndModal from "../../components/play/modals/gameEndModal";
import ChatSection from "../../components/play/chatSection";
import VideoCall from "../../components/play/VideoCall";
import DrawingTools from "../../components/play/drawingtools";
import { useCanvasDrawing } from "../../hooks/useCanvasDrawing";
import { useGameSocket } from "../../hooks/useGameSocket";
import {
  LuEraser,
  LuPalette,
  LuClock,
  LuTrash2,
  LuPencil,
  LuMenu,
  LuX,
  LuPaintBucket,
  LuUndo2,
} from "react-icons/lu";

const PALETTE = [
  { name: "Black", value: "#000000" },
  { name: "White", value: "#ffffff" },
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Yellow", value: "#f59e0b" },
  { name: "Orange", value: "#f97316" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Brown", value: "#78350f" },
  { name: "Gray", value: "#6b7280" },
  { name: "Cyan", value: "#06b6d4" },
];

const Page = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const chatRef = useRef<HTMLDivElement | null>(null);

  // Modular custom socket & game state hook
  const {
    socket,
    messages,
    message,
    setMessage,
    sendMessage,
    handleKeyPress,
    players,
    isReady,
    canStart,
    timeLeft,
    formatTime,
    wordChoices,
    currentWord,
    wordHint,
    isCurrentDrawer,
    roundResults,
    gameResults,
    preparationCountdown,
    showPreparation,
    currentTurn,
    totalTurnsInRound,
    gameState,
    activeModal,
    closeAllModals,
    toggleReady,
    selectWord,
  } = useGameSocket({ roomId });

  // Modular canvas drawing hook
  const {
    canvasRef,
    currentColor,
    currentStroke,
    toolMode,
    isErasing,
    setToolMode,
    handleColorChange,
    handleStrokeChange,
    clearCanvas,
    handleUndo,
    startDrawing,
    stopDrawing,
    draw,
  } = useCanvasDrawing({
    socket,
    roomId,
    isCurrentDrawer,
  });

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar socket={socket} />

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-20 right-4 z-50">
        <Button
          type="primary"
          shape="circle"
          icon={isMobileSidebarOpen ? <LuX /> : <LuMenu />}
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="shadow-lg"
        />
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] gap-2 md:gap-4 p-2 md:p-4 overflow-hidden">
        {/* Main Game Area */}
        <div className="flex-1 flex flex-col space-y-2 md:space-y-4 min-h-0">
          {/* Game Header */}
          <Card
            className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl"
            styles={{ body: { padding: "12px 16px" } }}
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center space-x-4">
                <h2 className="text-base sm:text-xl font-bold text-gray-800">
                  {gameState.state === "waiting" && "Waiting for Players"}
                  {gameState.state === "playing" &&
                    gameState.round > 0 &&
                    `Round ${gameState.round}/${gameState.totalRounds} — Turn ${currentTurn}/${totalTurnsInRound}`}
                  {gameState.state === "playing" &&
                    gameState.round === 0 &&
                    "Game Starting..."}
                  {gameState.state === "ended" && "Game Ended"}
                </h2>
                {gameState.state === "playing" && timeLeft > 0 && (
                  <div className="flex items-center space-x-2 text-red-500">
                    <LuClock className="w-5 h-5" />
                    <span className="text-base sm:text-lg font-mono font-bold">
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                )}
              </div>

              {gameState.state === "playing" && !showPreparation && (
                <div className="text-center">
                  {isCurrentDrawer ? (
                    <div className="flex items-center space-x-2 bg-purple-100 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm">
                      <LuPalette className="text-purple-600" />
                      <span className="text-purple-700 font-semibold">
                        Your Turn: {currentWord || "Drawing..."}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 bg-blue-100 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm">
                      <span className="text-blue-700">
                        Word:{" "}
                        <span className="font-mono text-base sm:text-lg font-bold tracking-wider">
                          {wordHint || "_ _ _"}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {gameState.state === "playing" && timeLeft > 0 && (
              <Progress
                percent={(timeLeft / 80000) * 100}
                showInfo={false}
                strokeColor={timeLeft < 20000 ? "#ef4444" : "#3b82f6"}
                className="mt-2 sm:mt-4"
                strokeWidth={4}
              />
            )}
          </Card>

          {/* Preparation Banner */}
          {showPreparation && (
            <Card
              className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 shadow-lg rounded-2xl"
              styles={{ body: { padding: "12px 16px" } }}
            >
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-bold text-green-800 mb-1">
                  {isCurrentDrawer ? "It's Your Turn!" : "Get Ready!"}
                </h3>
                <p className="text-xs sm:text-sm text-green-600 mb-1">
                  {isCurrentDrawer
                    ? "Select a word from the options to start drawing"
                    : `${gameState.currentDrawer} is selecting a word...`}
                </p>
                <div className="text-xl sm:text-2xl font-bold text-green-800">
                  {preparationCountdown > 0
                    ? `${preparationCountdown} seconds`
                    : "Starting..."}
                </div>
              </div>
            </Card>
          )}

          {/* Canvas and Drawing Tools */}
          <div className="flex-1 flex flex-col lg:flex-row gap-2 md:gap-4 min-h-0">
            {/* HTML5 Canvas */}
            <div className="flex-1 bg-white rounded-2xl shadow-lg p-2 md:p-4 flex items-center justify-center relative min-h-0 overflow-hidden">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseMove={draw}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchEnd={stopDrawing}
                onTouchMove={draw}
                className={`max-w-full max-h-full aspect-[4/3] border-2 border-gray-200 rounded-xl shadow-inner bg-white
                  ${
                    isCurrentDrawer
                      ? toolMode === "eraser"
                        ? "cursor-crosshair"
                        : "cursor-crosshair"
                      : "cursor-not-allowed"
                  }
                  ${!isCurrentDrawer ? "pointer-events-none" : ""}
                `}
                style={{ touchAction: "none" }}
              />
            </div>

            {/* Drawing Tools - Desktop */}
            {isCurrentDrawer && (
              <div className="hidden lg:flex flex-col w-16">
                <DrawingTools
                  currentColor={currentColor}
                  currentStroke={currentStroke}
                  toolMode={toolMode}
                  setToolMode={setToolMode}
                  handleColorChange={handleColorChange}
                  handleStrokeChange={handleStrokeChange}
                  clearCanvas={clearCanvas}
                  undo={handleUndo}
                />
              </div>
            )}

            {/* Drawing Tools - Mobile */}
            {isCurrentDrawer && (
              <div className="lg:hidden bg-white rounded-2xl shadow-lg p-3 flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      type={toolMode === "brush" ? "primary" : "default"}
                      size="middle"
                      icon={<LuPencil />}
                      onClick={() => setToolMode("brush")}
                      className="flex items-center justify-center !px-2.5"
                    />
                    <Button
                      type={toolMode === "fill" ? "primary" : "default"}
                      size="middle"
                      icon={<LuPaintBucket />}
                      onClick={() => setToolMode("fill")}
                      className="flex items-center justify-center !px-2.5"
                    />
                    <Button
                      type={toolMode === "eraser" ? "primary" : "default"}
                      size="middle"
                      icon={<LuEraser />}
                      onClick={() => setToolMode("eraser")}
                      className="flex items-center justify-center !px-2.5"
                    />
                    <Button
                      type="default"
                      size="middle"
                      icon={<LuUndo2 />}
                      onClick={handleUndo}
                      className="flex items-center justify-center !px-2.5"
                    />
                    <Button
                      type="default"
                      danger
                      size="middle"
                      icon={<LuTrash2 />}
                      onClick={clearCanvas}
                      className="flex items-center justify-center !px-2.5"
                    />
                  </div>

                  {/* Brush Size - Mobile */}
                  <div className="flex items-center gap-2 flex-1 max-w-[130px]">
                    <Slider
                      min={2}
                      max={24}
                      step={2}
                      value={currentStroke}
                      onChange={handleStrokeChange}
                      className="flex-1 !my-0"
                    />
                    <span className="text-[11px] text-gray-500 w-6 shrink-0">
                      {currentStroke}p
                    </span>
                  </div>
                </div>

                {/* Colors - Mobile */}
                <div className="flex gap-2 overflow-x-auto py-1">
                  {PALETTE.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleColorChange(color.value)}
                      className={`w-7 h-7 rounded-full shadow-sm border-2 shrink-0 transition-transform ${
                        currentColor === color.value && !isErasing
                          ? "border-purple-600 scale-110 ring-2 ring-purple-300"
                          : "border-gray-200"
                      }`}
                      style={{ backgroundColor: color.value }}
                      type="button"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div
          className={`w-full lg:w-80 space-y-4 ${
            isMobileSidebarOpen ? "block" : "hidden lg:block"
          }`}
        >
          {/* Player List */}
          <PlayerList
            players={players}
            gameState={gameState}
            isReady={isReady}
            toggleReady={toggleReady}
            canStart={canStart}
          />

          {/* Video Call */}
          <VideoCall socket={socket} players={players} selfId={socket?.id} />

          {/* Chat Section */}
          <div ref={chatRef} className="h-64 sm:h-80">
            <ChatSection
              messages={messages}
              setMessage={setMessage}
              message={message}
              sendMessage={sendMessage}
              chatRef={chatRef}
              handleKeyPress={handleKeyPress}
              socket={socket}
            />
          </div>
        </div>
      </div>

      {/* Word Select Modal */}
      <WordSelectModal
        showWordModal={activeModal === "wordSelect"}
        wordChoices={wordChoices}
        selectWord={selectWord}
      />

      {/* Round/Turn Result Modal */}
      <RoundResultModal
        showResultsModal={activeModal === "roundResult"}
        setShowResultsModal={() => closeAllModals()}
        roundResults={roundResults}
        players={players}
        gameState={gameState}
      />

      {/* Game End Modal */}
      <GameEndModal
        showGameEndModal={activeModal === "gameEnd"}
        setShowGameEndModal={() => closeAllModals()}
        gameResults={gameResults}
      />
    </div>
  );
};

export default Page;
