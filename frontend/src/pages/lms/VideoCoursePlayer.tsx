import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const VideoCoursePlayer: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { title, courseData } = location.state || {
        title: "Course Title",
        courseData: null
    };
    const [activeTab, setActiveTab] = useState("contents");
    const [expandedModule, setExpandedModule] = useState<number | null>(null);

    // Sidebar Resizer
    const [sidebarWidth, setSidebarWidth] = useState(400);
    const isResizingRef = useRef(false);

    const startResizing = React.useCallback(() => {
        isResizingRef.current = true;
        document.addEventListener("mousemove", resize);
        document.addEventListener("mouseup", stopResizing);
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    }, []);

    const stopResizing = React.useCallback(() => {
        isResizingRef.current = false;
        document.removeEventListener("mousemove", resize);
        document.removeEventListener("mouseup", stopResizing);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
    }, []);

    const resize = React.useCallback((e: MouseEvent) => {
        if (isResizingRef.current) {
            // Limit sidebar width between 250px and 600px
            const newWidth = Math.max(250, Math.min(600, e.clientX));
            setSidebarWidth(newWidth);
        }
    }, []);

    // Video Player State
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState("00:00");
    const [duration, setDuration] = useState("00:00");
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [activeMenu, setActiveMenu] = useState<'main' | 'speed'>('main');
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    const togglePiP = async () => {
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else if (videoRef.current) {
                await videoRef.current.requestPictureInPicture();
            }
        } catch (error) {
            console.error(error);
        }
        setShowSettings(false);
    };



    // Mock Video Source (using a sample video URL)
    // In a real app, this would come from the active item
    const videoSrc = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

    // Generate dynamic modules based on course data
    const generateModules = () => {
        if (!courseData) {
            // Fallback to default modules if no course data
            return [
                {
                    id: 1,
                    title: "Module 1: Introduction",
                    items: [
                        { id: 1, title: "Course Overview", type: "video", duration: "10:00", active: true },
                        { id: 2, title: "Syllabus & Study Plan", type: "doc", duration: "5 min read" },
                    ],
                },
                {
                    id: 2,
                    title: "Module 2: Core Concepts",
                    items: [
                        { id: 3, title: "Basics Explained", type: "video", duration: "45:00" },
                        { id: 4, title: "Important Formulas", type: "video", duration: "30:00" },
                        { id: 5, title: "Formula Sheet", type: "doc", duration: "10 min read" },
                    ],
                },
                {
                    id: 3,
                    title: "Module 3: Practice & Tests",
                    items: [
                        { id: 6, title: "Topic-wise Practice Test", type: "test", duration: "30 mins" },
                        { id: 7, title: "Mini Mock Test", type: "test", duration: "1 hour" },
                    ],
                },
            ];
        }

        const modules = [];
        const videosPerModule = 10;
        const testsPerModule = 3;

        // Calculate number of modules needed
        const videoModules = Math.ceil(courseData.totalVideos / videosPerModule);
        const testModules = Math.ceil(courseData.totalTests / testsPerModule);

        let itemId = 1;
        let moduleId = 1;

        // Generate video modules
        for (let i = 0; i < videoModules; i++) {
            const videosInThisModule = Math.min(videosPerModule, courseData.totalVideos - (i * videosPerModule));
            const items = [];

            for (let j = 0; j < videosInThisModule; j++) {
                const lessonNumber = (i * videosPerModule) + j + 1;
                items.push({
                    id: itemId++,
                    title: `Lesson ${lessonNumber}: ${title.split(' ')[0]} Concepts`,
                    type: "video",
                    duration: `${Math.floor(Math.random() * 30 + 15)}:00`,
                    active: i === 0 && j === 0 // First video is active
                });
            }

            modules.push({
                id: moduleId++,
                title: `Module ${i + 1}: Core Content`,
                items
            });
        }

        // Generate test modules
        for (let i = 0; i < testModules; i++) {
            const testsInThisModule = Math.min(testsPerModule, courseData.totalTests - (i * testModules));
            const items = [];

            for (let j = 0; j < testsInThisModule; j++) {
                const testNumber = (i * testsPerModule) + j + 1;
                items.push({
                    id: itemId++,
                    title: `Test ${testNumber}: Assessment`,
                    type: "test",
                    duration: `${Math.floor(Math.random() * 60 + 30)} mins`
                });
            }

            modules.push({
                id: moduleId++,
                title: `Module ${videoModules + i + 1}: Practice & Tests`,
                items
            });
        }

        return modules;
    };

    const modules = generateModules();

    const handleModuleClick = (id: number) => {
        setExpandedModule(expandedModule === id ? null : id);
    };

    // Video Handlers
    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const total = videoRef.current.duration;
            const progressPercent = (current / total) * 100;
            setProgress(progressPercent);
            setCurrentTime(formatTime(current));
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(formatTime(videoRef.current.duration));
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (videoRef.current) {
            const seekTime = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
            videoRef.current.currentTime = seekTime;
            setProgress(parseFloat(e.target.value));
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            videoRef.current?.parentElement?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    // Hide controls after inactivity
    useEffect(() => {
        let timeout: any;
        const handleMouseMove = () => {
            setShowControls(true);
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (isPlaying) setShowControls(false);
            }, 3000);
        };

        const videoContainer = videoRef.current?.parentElement;
        if (videoContainer) {
            videoContainer.addEventListener('mousemove', handleMouseMove);
            videoContainer.addEventListener('mouseleave', () => setShowControls(false));
        }

        return () => {
            if (videoContainer) {
                videoContainer.removeEventListener('mousemove', handleMouseMove);
                //   videoContainer.removeEventListener('mouseleave', () => setShowControls(false));
            }
            clearTimeout(timeout);
        };
    }, [isPlaying]);


    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-[#0c1427] font-body"> {/* Added font-body and bg color */}
            {/* Header */}
            <header className="h-[70px] border-b border-gray-200 dark:border-[#172036] flex items-center justify-between px-6 bg-white dark:bg-[#0c1427] z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-[40px] h-[40px] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <i className="material-symbols-outlined text-gray-600 dark:text-gray-300">
                            arrow_back
                        </i>
                    </button>
                    <div className="flex flex-col">
                        <h1 className="!text-[20px] font-bold text-gray-900 dark:text-white leading-tight">
                            {title}
                        </h1>

                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.1">
                            <span className="bg-blue-100 text-blue-700 px-1.5 py-px rounded font-small">Video Course</span>
                            <span>•</span>
                            <span>Last played: Course Overview</span>
                        </div>
                    </div>
                </div>
                <div>
                    <button className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-[#111c33] p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                        <div className="flex flex-col items-end hidden md:flex">
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Olivia</span>
                            <span className="text-[10px] text-gray-500">Student</span>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white dark:ring-[#0c1427]">
                            OL
                        </div>
                    </button>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                {/* Sidebar */}
                <div
                    className="border-r border-gray-200 dark:border-[#172036] flex flex-col bg-white dark:bg-[#0c1427] shadow-lg z-10 w-full lg:w-auto lg:relative shrink-0 order-2 lg:order-1 h-[400px] lg:h-auto overflow-hidden"
                    style={{ width: window.innerWidth >= 1024 ? `${sidebarWidth}px` : '100%' }}
                >
                    {/* Resizer Handle */}
                    <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors z-50 group/resizer"
                        onMouseDown={startResizing}
                    >
                        <div className="absolute right-0 top-0 bottom-0 w-4 -mr-2 bg-transparent group-hover/resizer:bg-blue-500/10 transition-colors"></div>
                    </div>
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-[#172036]">
                        {["contents", "live classes"].map((tab) => (
                            <button
                                key={tab}
                                className={`flex-1 py-4 text-sm font-semibold border-b-2 transition-all capitalize ${activeTab === tab
                                    ? "border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-900/10"
                                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#111c33]"
                                    }`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Module List */}
                    <div className="flex-1 overflow-y-auto sidebar-custom-scrollbar">
                        {activeTab === "contents" && (
                            <div className="flex flex-col">
                                {modules.map((module) => (
                                    <div key={module.id} className="border-b border-gray-100 dark:border-[#172036]">
                                        <button
                                            onClick={() => handleModuleClick(module.id)}
                                            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-[#111c33] transition-colors text-left group"
                                        >
                                            <span className="font-bold text-sm text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition-colors">
                                                {module.title}
                                            </span>
                                            <i
                                                className={`material-symbols-outlined text-gray-400 text-xl transition-transform duration-300 ${expandedModule === module.id ? "rotate-180" : ""
                                                    }`}
                                            >
                                                expand_more
                                            </i>
                                        </button>

                                        <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${expandedModule === module.id ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                                            <div className="overflow-hidden bg-gray-50 dark:bg-[#0f172a]">
                                                {module.items.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className={`p-3 pl-6 flex gap-3 cursor-pointer transition-all border-l-4 ${item.active
                                                            ? "bg-white dark:bg-[#1e293b] border-blue-600 shadow-sm"
                                                            : "border-transparent hover:bg-gray-100 dark:hover:bg-[#1e293b] hover:border-gray-300"
                                                            }`}
                                                    >
                                                        <div className="mt-0.5">
                                                            {item.active ? (
                                                                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                                                                    <i className="material-symbols-outlined text-white text-[14px] font-bold">check</i>
                                                                </div>
                                                            ) : (
                                                                item.type === 'video' ? (
                                                                    <img
                                                                        src="/images/play.png"
                                                                        alt="play"
                                                                        className="w-[18px] h-[18px] object-contain"
                                                                    />
                                                                ) : item.type === 'test' ? (
                                                                    <i className="material-symbols-outlined text-lg text-gray-400">quiz</i>
                                                                ) : (
                                                                    <i className="material-symbols-outlined text-lg text-gray-400">description</i>
                                                                )
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span
                                                                className={`text-sm font-medium leading-tight ${item.active
                                                                    ? "text-blue-600"
                                                                    : "text-gray-700 dark:text-gray-300"
                                                                    }`}
                                                            >
                                                                {item.title}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[11px] text-gray-500 bg-gray-200 dark:bg-gray-700 px-1.5 rounded">
                                                                    {item.duration}
                                                                </span>
                                                                {item.type === "test" && (
                                                                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 rounded font-medium border border-yellow-200">Test</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {activeTab === "live classes" && (
                            <div className="flex flex-col gap-3 p-4">
                                {[
                                    {
                                        id: 1,
                                        title: "Laws of Motion",
                                        instructor: "Dr. Sharma",
                                        time: "2:00 PM - 3:30 PM",
                                        date: "Feb 15, 2026",
                                        students: 145,
                                        status: "live"
                                    },
                                    {
                                        id: 2,
                                        title: "Organic Reactions",
                                        instructor: "Prof. Gupta",
                                        time: "4:00 PM - 5:30 PM",
                                        date: "Mar 8, 2026",
                                        students: 98,
                                        status: "upcoming"
                                    },
                                    {
                                        id: 3,
                                        title: "Calculus Basics",
                                        instructor: "Dr. Verma",
                                        time: "6:00 PM - 7:30 PM",
                                        date: "Apr 22, 2026",
                                        students: 203,
                                        status: "upcoming"
                                    },
                                    {
                                        id: 4,
                                        title: "Cell Structure",
                                        instructor: "Dr. Patel",
                                        time: "10:00 AM - 11:30 AM",
                                        date: "May 10, 2026",
                                        students: 167,
                                        status: "upcoming"
                                    }
                                ].map((liveClass) => (
                                    <div
                                        key={liveClass.id}
                                        className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-[#2d3a52] rounded-lg p-1 hover:bg-gray-50 dark:hover:bg-[#0f172a] transition-all cursor-pointer group"
                                    >
                                        <div className="flex gap-3 items-start p-2">
                                            <div className="w-[50px] h-[50px] rounded-lg shrink-0 overflow-hidden flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                                <img
                                                    src="/images/play.png"
                                                    alt="play"
                                                    className="w-[28px] h-[28px] object-contain"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between">
                                                    <p className="text-[15px] font-bold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 leading-tight">
                                                        {liveClass.title}
                                                    </p>
                                                    {liveClass.status === "live" && (
                                                        <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full shrink-0 border border-red-200 dark:border-red-800 shadow-sm animate-pulse">
                                                            <span className="relative flex h-2 w-2">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]"></span>
                                                            </span>
                                                            <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Live</span>
                                                        </div>
                                                    )}
                                                    {liveClass.status === "upcoming" && (
                                                        <span className="text-[9px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0 border border-green-200 dark:border-green-800">
                                                            Upcoming
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-400 -mt-1 mb-1">
                                                    <span>{liveClass.time}</span>
                                                    <span className="w-px h-3 bg-gray-600 dark:bg-gray-300"></span>
                                                    <span>{liveClass.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-white dark:bg-[#0f172a] px-4 md:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8 pt-2 order-1 lg:order-2">
                    <div className="max-w-6xl mx-auto">
                        {/* Video Player Container */}
                        <div className="bg-black rounded-xl overflow-hidden shadow-2xl relative mb-5 group aspect-video ring-1 ring-gray-900/5 w-full max-h-[75vh]">

                            <video
                                ref={videoRef}
                                src={videoSrc}
                                className="w-full h-full object-contain cursor-pointer"
                                onClick={togglePlay}
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop"
                            />

                            {/* Big Play Button (only when paused) */}
                            {!isPlaying && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                                    <button
                                        className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-all shadow-xl pointer-events-auto group-hover:scale-110 duration-300"
                                        onClick={togglePlay}
                                    >
                                        <i className="material-symbols-outlined text-white text-5xl ml-2">play_arrow</i>
                                    </button>
                                </div>
                            )}

                            {/* Controls Overlay */}
                            <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${showControls || !isPlaying ? "opacity-100" : "opacity-0"}`}>

                                {/* Progress Bar */}
                                <div className="relative h-1.5 bg-gray-600/50 rounded-full mb-4 cursor-pointer group/progress">
                                    <div className="absolute inset-0 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 relative"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={progress}
                                        onChange={handleSeek}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    {/* Thumb Indicator (visible on hover) */}
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md opacity-0 group-hover/progress:opacity-100 pointer-events-none transition-opacity"
                                        style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
                                    ></div>
                                </div>

                                <div className="flex items-center justify-between text-white">
                                    <div className="flex items-center gap-4">
                                        <button onClick={togglePlay} className="hover:text-blue-400 transition-colors">
                                            <i className="material-symbols-outlined text-3xl font-light">
                                                {isPlaying ? 'pause' : 'play_arrow'}
                                            </i>
                                        </button>
                                        <div className="flex items-center gap-2 text-sm font-medium tracking-wide">
                                            <span>{currentTime}</span>
                                            <span className="text-gray-400">/</span>
                                            <span className="text-gray-300">{duration}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 group/volume">
                                            <button onClick={toggleMute} className="hover:text-blue-400 transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10">
                                                <i className="material-symbols-outlined text-2xl">
                                                    {isMuted || volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
                                                </i>
                                            </button>
                                            <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300 ease-in-out flex items-center">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="1"
                                                    step="0.05"
                                                    value={isMuted ? 0 : volume}
                                                    onChange={(e) => {
                                                        const newVol = parseFloat(e.target.value);
                                                        setVolume(newVol);
                                                        if (videoRef.current) {
                                                            videoRef.current.volume = newVol;
                                                            videoRef.current.muted = newVol === 0;
                                                        }
                                                        setIsMuted(newVol === 0);
                                                    }}
                                                    className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 mr-2"
                                                />
                                            </div>
                                        </div>
                                        <button onClick={toggleFullscreen} className="hover:text-blue-400 transition-colors">
                                            <i className="material-symbols-outlined text-2xl">
                                                {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                                            </i>
                                        </button>
                                        <div className="relative">
                                            {showSettings && (
                                                <div className="absolute bottom-full right-0 mb-4 w-64 bg-white rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
                                                    {activeMenu === 'main' ? (
                                                        <>
                                                            <button
                                                                onClick={() => setActiveMenu('speed')}
                                                                className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center justify-between text-gray-800 transition-colors border-b border-gray-100"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <i className="material-symbols-outlined text-xl">speed</i>
                                                                    <span className="text-sm font-medium">Playback speed</span>
                                                                </div>
                                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                                    <span>{playbackSpeed === 1 ? 'Normal' : playbackSpeed + 'x'}</span>
                                                                    <i className="material-symbols-outlined text-sm">chevron_right</i>
                                                                </div>
                                                            </button>
                                                            <button
                                                                onClick={togglePiP}
                                                                className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 text-gray-800 transition-colors"
                                                            >
                                                                <i className="material-symbols-outlined text-xl">picture_in_picture_alt</i>
                                                                <span className="text-sm font-medium">Picture-in-picture</span>
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => setActiveMenu('main')}
                                                                className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-800 transition-colors border-b border-gray-100 font-medium"
                                                            >
                                                                <i className="material-symbols-outlined text-lg">arrow_back</i>
                                                                <span className="text-sm">Playback speed</span>
                                                            </button>
                                                            <div className="max-h-60 overflow-y-auto no-scrollbar">
                                                                {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                                                                    <button
                                                                        key={speed}
                                                                        onClick={() => {
                                                                            setPlaybackSpeed(speed);
                                                                            if (videoRef.current) videoRef.current.playbackRate = speed;
                                                                            setShowSettings(false);
                                                                            setActiveMenu('main');
                                                                        }}
                                                                        className="w-full px-4 py-2.5 text-left hover:bg-gray-100 flex items-center gap-3 text-gray-800 transition-colors"
                                                                    >
                                                                        {playbackSpeed === speed ? (
                                                                            <i className="material-symbols-outlined text-lg text-blue-600">check</i>
                                                                        ) : (
                                                                            <span className="w-[18px]"></span>
                                                                        )}
                                                                        <span className={`text-sm ${playbackSpeed === speed ? 'font-bold' : ''}`}>
                                                                            {speed === 1 ? 'Normal' : speed}
                                                                        </span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                            <button
                                                onClick={() => setShowSettings(!showSettings)}
                                                className={`transition-colors rounded-full w-8 h-8 flex items-center justify-center ${showSettings ? "bg-white/20 text-white" : "hover:bg-white/10 hover:text-blue-400"}`}
                                            >
                                                <i className="material-symbols-outlined text-2xl">more_vert</i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="mb-4 px-2">
                            <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                        </span>
                                        <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">Now Playing</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Course Overview</h2>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <i className="material-symbols-outlined text-[18px]">videocam</i>
                                            <span>Video Lesson</span>
                                        </div>
                                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                        <div className="flex items-center gap-1.5">
                                            <i className="material-symbols-outlined text-[18px]">schedule</i>
                                            <span>10:00 Mins</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto mt-2">
                                    <button className="px-5 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-colors border border-transparent hover:border-gray-200">
                                        Previous
                                    </button>
                                    <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 active:scale-95">
                                        <span>Mark Complete & Next</span>
                                        <i className="material-symbols-outlined text-lg">arrow_forward</i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoCoursePlayer;
