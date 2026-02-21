import ThreadedChat from './components/ThreadedChat'

function App() {
    return (
        <div className="min-h-screen bg-[#111] text-gray-200 font-sans">
            <header className="max-w-3xl mx-auto py-8 px-4 border-b border-gray-800 flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Q<span className="text-orange-500">&</span>A</h1>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Public Discussion Board</div>
            </header>

            <main className="max-w-3xl mx-auto py-6">
                <ThreadedChat roomId="general" />
            </main>

            <footer className="text-center py-12 text-gray-600 text-[9px] uppercase tracking-widest">
                Built for Campus Ecosystem
            </footer>
        </div>
    )
}

export default App
