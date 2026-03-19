import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Loader2, PaintBucket, Sparkles, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeRoomImage, RoomAnalysisResult } from './services/gemini';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<RoomAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImage(base64String);
      setResult(null);
      setError(null);
      analyzeImage(base64String.split(',')[1], file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImage(base64String);
      setResult(null);
      setError(null);
      analyzeImage(base64String.split(',')[1], file.type);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (base64Data: string, mimeType: string) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const analysis = await analyzeRoomImage(base64Data, mimeType);
      setResult(analysis);
    } catch (err) {
      console.error(err);
      setError("图片分析失败，请重试。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-stone-900 font-sans selection:bg-stone-200">
      <header className="py-8 px-6 md:px-12 border-b border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-900 rounded-full flex items-center justify-center text-white">
              <PaintBucket size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Miller Paint 色彩助手</h1>
              <p className="text-sm text-stone-500">AI 色彩搭配与风格分析</p>
            </div>
          </div>
          {image && (
            <button
              onClick={reset}
              className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors px-4 py-2 rounded-full hover:bg-stone-100"
            >
              <RefreshCw size={16} />
              重新开始
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 md:px-12 py-12">
        <AnimatePresence mode="wait">
          {!image ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-10">
                <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4 font-serif">
                  发现属于你房间的完美色彩。
                </h2>
                <p className="text-lg text-stone-500">
                  上传一张你房间的照片。我们的 AI 将识别你的室内风格，并为你量身推荐三款精美的 Miller Paint 缎光漆颜色。
                </p>
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-300 rounded-3xl p-12 text-center cursor-pointer hover:border-stone-500 hover:bg-white/50 transition-all group bg-white shadow-sm"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Upload size={32} className="text-stone-600" />
                </div>
                <h3 className="text-xl font-medium mb-2">点击或拖拽照片到此处</h3>
                <p className="text-stone-500 text-sm">支持 JPG, PNG, WEBP 格式</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12"
            >
              <div className="lg:col-span-5">
                <div className="sticky top-12">
                  <div className="rounded-3xl overflow-hidden shadow-lg bg-white border border-stone-200">
                    <img src={image} alt="Uploaded room" className="w-full h-auto object-cover" />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                {isAnalyzing ? (
                  <div className="h-full flex flex-col items-center justify-center py-20 text-stone-500">
                    <Loader2 size={48} className="animate-spin mb-6 text-stone-800" />
                    <h3 className="text-2xl font-serif mb-2 text-stone-800">正在分析您的空间...</h3>
                    <p>正在识别风格并匹配 Miller Paint 色彩</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 text-red-800 p-6 rounded-2xl border border-red-100">
                    <p>{error}</p>
                    <button onClick={reset} className="mt-4 underline font-medium">尝试其他照片</button>
                  </div>
                ) : result ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="mb-12">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-200 text-stone-800 text-xs font-bold uppercase tracking-widest mb-4">
                        <Sparkles size={14} />
                        风格分析
                      </div>
                      <h2 className="text-4xl font-serif mb-4">{result.roomStyle}</h2>
                      <p className="text-lg text-stone-600 leading-relaxed">
                        {result.styleDescription}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-medium mb-6 border-b border-stone-200 pb-4">
                        推荐的 Miller Paint 颜色 <span className="text-stone-400 font-normal text-base ml-2">(缎光漆)</span>
                      </h3>
                      <div className="space-y-6">
                        {result.recommendedColors.map((color, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            className="flex flex-col sm:flex-row gap-6 bg-white p-6 rounded-3xl shadow-sm border border-stone-100"
                          >
                            <div className="shrink-0">
                              <div
                                className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl shadow-inner border border-black/5"
                                style={{ backgroundColor: color.hex }}
                              />
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                              <div className="flex items-baseline justify-between mb-2">
                                <h4 className="text-2xl font-serif">{color.name}</h4>
                                <span className="font-mono text-sm text-stone-400 uppercase tracking-wider">{color.hex}</span>
                              </div>
                              <p className="text-stone-600 text-sm leading-relaxed">
                                {color.reason}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
