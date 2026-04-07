import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Hammer, 
  ShoppingCart, 
  Users, 
  FileText, 
  HelpCircle,
  ChevronRight,
  BookOpen,
  MessageSquare,
  Sparkles,
  Send,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface TutorialSection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: string;
  isWalkthrough?: boolean;
  steps?: {
    title: string;
    desc: string;
    action: string;
  }[];
  tips?: string[];
}

const TUTORIAL_SECTIONS: TutorialSection[] = [
  {
    id: 'walkthrough',
    title: 'Workflow: From Intake to Sale',
    icon: Sparkles,
    content: 'Follow this typical journey of a furniture piece through your shop system.',
    isWalkthrough: true,
    steps: [
      {
        title: '1. The Find (Inventory)',
        desc: 'You find a mid-century dresser at an estate sale. First, go to "Inventory" and add it as a "Furniture Piece". Snap a photo of its original state using the "Upload Photo" button.',
        action: 'Inventory > Add Item'
      },
      {
        title: '2. Triage (Projects)',
        desc: 'Decide the brand. If it just needs a sand and finish, it\'s "Twisted Twig". If it needs structural repair, assign it to "Wood Grain Alchemist". Create a "New Work Order" in Projects.',
        action: 'Projects > New Work Order'
      },
      {
        title: '3. The Craft (Work Logs)',
        desc: 'As you work, open the project and "Add Entry" to the Work Log. Use the "Project Gallery" to upload progress photos—this builds a visual history for the client.',
        action: 'Project Detail > Add Entry'
      },
      {
        title: '4. The Sale (Closing)',
        desc: 'Once sold, move the project to "Complete". Record the "Actual Sale Price". This data instantly flows into your "Sales & Profit" reports.',
        action: 'Kanban > Move to Complete'
      }
    ]
  },
  {
    id: 'dashboard',
    title: 'Dashboard: The Shop Floor',
    icon: LayoutDashboard,
    content: 'The Dashboard is your digital shop whiteboard. Use "Shop Notes" to leave quick messages for each other. The stats at the top give you a real-time pulse on active work and inventory value.',
    tips: ['Tap "Add Note" to jot down a supply need.', 'Check "Active Work Orders" to see what needs attention today.']
  },
  {
    id: 'inventory',
    title: 'Inventory: Materials & WIP',
    icon: Package,
    content: 'Track everything from raw lumber to finished furniture. Categorize items as "Raw Material", "Furniture Piece", or "Supply".',
    tips: ['Set a "Current Condition" for used furniture acquisitions.', 'Keep track of board-foot costs for Wood Grain Alchemist builds.']
  },
  {
    id: 'projects',
    title: 'Projects: The Kanban Board',
    icon: Hammer,
    content: 'Manage the flow of work using the Kanban board. Move projects from Intake to Complete. Each card shows the brand (Twisted Twig or WGA) and target sale price.',
    tips: ['Use the "Quick Advance" arrow to move a project to the next stage.', 'Open a project to access the "Pricing Calculator" and "Work Logs".']
  },
  {
    id: 'purchasing',
    title: 'Purchasing: Snap & Save',
    icon: ShoppingCart,
    content: 'The easiest way to track expenses. Use "Snap Receipt" to take a photo of any receipt—the AI will automatically read the vendor, date, and items for you.',
    tips: ['Use your phone camera directly from the shop floor.', 'Monthly spend is tracked automatically for your end-of-month reports.']
  },
  {
    id: 'customers',
    title: 'Customers: Your Database',
    icon: Users,
    content: 'A centralized place for all your client contacts and their purchase history. Great for tracking commission requests.',
    tips: ['Link projects to customers to build their purchase history.', 'Keep contact details handy for delivery coordination.']
  },
  {
    id: 'financials',
    title: 'Financials: Business Intelligence',
    icon: FileText,
    content: 'Digital and physical financial reports for your business reviews. Track profit margins, monthly revenue, and inventory health via the Loan Officer Summary, Profit & Loss, and Balance Sheet.',
    tips: ['Use "Export CSV" to save data for your accountant.', 'Use "Print Report" for your physical monthly review meetings.']
  }
];

export default function Help() {
  const [selectedSection, setSelectedSection] = useState(TUTORIAL_SECTIONS[0]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  const handleAskGemini = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsAsking(true);
    setAnswer('');
    
    try {
      const model = ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: question,
        config: {
          systemInstruction: `You are the Twisted Alchemy shop assistant — an expert in furniture refurbishment, woodworking, and small business operations for a two-person husband-wife shop.

The shop runs two brands:
- **Twisted Twig**: Cosmetic refurbishment of secondhand furniture. Focus on paint, stain, hardware, upholstery, and aesthetic transformation.
- **Wood Grain Alchemist (WGA)**: Custom furniture builds from raw lumber, and structural repairs for Twisted Twig pieces that need more than cosmetic work.

You have deep knowledge of:
- Wood species, grain patterns, joinery, finishing techniques (milk paint, chalk paint, danish oil, poly, lacquer)
- Pricing strategy for artisan furniture: cost-plus, value-based, competitive market rates
- Sourcing: thrift stores, estate sales, Facebook Marketplace, lumber yards
- Small business operations: cash flow, loan prep, inventory tracking, job costing
- The CRM system itself: Projects (Intake → Assessment → Structural Repair → Finishing → Complete), Inventory (Raw Materials, Furniture Pieces, Supplies), Purchase Orders, Customers, and Financials

When answering:
- Be practical and direct — this is a working shop, not a hobbyist setting
- Give real numbers when asked about pricing or costs
- If asked about the CRM, give step-by-step instructions relevant to the actual workflow
- If asked about a loan or financials, help the user understand their P&L, margin, and what lenders look for
- Keep answers concise. The user is often on a phone in the shop.

Never say "I don't know" — give your best practical answer and note if you're estimating.`,
          temperature: 0.7,
        }
      });
      
      const response = await model;
      setAnswer(response.text || "I'm sorry, I couldn't find an answer to that.");
    } catch (error) {
      console.error('Error asking Gemini:', error);
      setAnswer("Something went wrong. Please try again.");
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <HelpCircle className="text-white w-8 h-8" />
        </div>
        <h2 className="text-4xl font-serif italic font-bold text-slate-900">App Guide & Support</h2>
        <p className="text-slate-600 max-w-lg mx-auto">
          Learn how to master your shop management system or ask a question to get instant help.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Tutorial Navigation */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">App Sections</h3>
          <div className="space-y-1">
            {TUTORIAL_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setSelectedSection(section)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                  selectedSection.id === section.id 
                    ? 'bg-olive-accent text-white shadow-md' 
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <section.icon size={18} />
                  <span className="font-bold text-sm">{section.title.split(':')[0]}</span>
                </div>
                <ChevronRight size={16} className={selectedSection.id === section.id ? 'opacity-100' : 'opacity-0'} />
              </button>
            ))}
          </div>
        </div>

        {/* Tutorial Detail */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedSection.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="card-refined p-8 space-y-8"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-100 rounded-xl">
                  <selectedSection.icon size={24} className="text-accent" />
                </div>
                <h3 className="text-2xl font-serif italic font-bold text-slate-900">{selectedSection.title}</h3>
              </div>

              <div className="space-y-6">
                <p className="text-slate-600 leading-relaxed text-lg">
                  {selectedSection.content}
                </p>

                {/* Walkthrough Steps */}
                {selectedSection.isWalkthrough && selectedSection.steps ? (
                  <div className="space-y-4 mt-8">
                    {selectedSection.steps.map((step, i) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="flex gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-slate-300 transition-all"
                      >
                        <div className="flex-none w-10 h-10 bg-olive-accent text-white rounded-full flex items-center justify-center font-serif italic text-lg shadow-md">
                          {i + 1}
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-bold text-stone-900 flex items-center gap-2">
                            {step.title}
                            <span className="text-[10px] bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">
                              {step.action}
                            </span>
                          </h4>
                          <p className="text-stone-500 text-sm leading-relaxed">{step.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles size={14} /> Pro Tips
                    </h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedSection.tips?.map((tip, i) => (
                        <li key={i} className="bg-stone-50 p-4 rounded-2xl text-sm text-stone-700 border border-stone-100 flex gap-3">
                          <div className="w-5 h-5 bg-olive-accent text-white rounded-full flex-none flex items-center justify-center text-[10px] font-bold">
                            {i + 1}
                          </div>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Ask Gemini Section */}
          <div className="mt-12 bg-dark-olive rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sparkles size={120} />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <MessageSquare className="text-slate-100" size={24} />
                <h3 className="text-xl font-serif italic font-bold">Have a Question?</h3>
              </div>
              <p className="text-stone-300 text-sm">
                Ask anything about using the app or for business advice. Our AI assistant is trained on your shop's workflow.
              </p>

              <form onSubmit={handleAskGemini} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. How do I track board-foot costs?"
                  className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
                <button 
                  disabled={isAsking}
                  className="bg-olive-accent hover:opacity-90 text-white px-6 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isAsking ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  <span>Ask</span>
                </button>
              </form>

              <AnimatePresence>
                {answer && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 text-stone-300 text-sm leading-relaxed"
                  >
                    <div className="flex items-center gap-2 mb-3 text-warm-bg font-bold text-[10px] uppercase tracking-widest">
                      <Sparkles size={12} /> Gemini Answer
                    </div>
                    {answer}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
