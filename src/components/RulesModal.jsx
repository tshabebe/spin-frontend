import React from 'react'
import { FaTimes } from 'react-icons/fa'

const Section = ({ title, children }) => (
  <div className="flex flex-col gap-2 bg-cyan-800 p-3 rounded-lg">
    <h4 className="font-semibold text-cyan-50 text-sm">{title}</h4>
    <div className="text-cyan-100 text-xs leading-relaxed">{children}</div>
  </div>
)

const RulesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-cyan-950/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div className="z-10 relative grid grid-rows-[auto,1fr] bg-cyan-900 shadow-xl m-4 p-4 border border-amber-300/20 rounded-2xl w-full max-w-md max-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center pb-2">
          <h3 className="font-bold text-cyan-50 text-base">
            የስፒን ጎማ ደንቦች (Spin Wheel Rules)
          </h3>
          <button
            onClick={onClose}
            className="bg-cyan-800 active:bg-cyan-700 p-2 rounded-md text-cyan-50"
            aria-label="Close"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3 min-h-0 overflow-y-auto">
          <Section title="እንዴት እንደሚጫወቱ (How to Play)">
            <ul className="pl-5 marker:text-amber-300 list-disc">
              <li>መጀመሪያ የጨዋታ መጠን ይምረጡ (Choose your bet amount).</li>
              <li>ጨዋታ ይፍጠሩ ወይም ይቀላቀሉ (Create or Join a game).</li>
              <li>
                ዝቅተኛ ተጫዋች ቁጥር ሲሞላ እዝመት ይጀምራል (Countdown starts when min players
                join).
              </li>
              <li>
                ጎማው ሲዞር አንዱ አሸናፊ ይመረጣል (Wheel spins and a winner is chosen).
              </li>
              <li>
                አሸናፊው የኩባንያ ክፍያን ከፍሎ 90% ይወስዳል (Winner gets 90% of total pot).
              </li>
            </ul>
          </Section>

          <Section title="የጨዋታ ሂደት (Game Flow)">
            <ul className="pl-5 marker:text-amber-300 list-disc">
              <li>መጠን ይምረጡ (Select stake) → ጨዋታ ይፍጠሩ/ይቀላቀሉ.</li>
              <li>ተጫዋቾች ሲጨመሩ እዝመት ይጀምራል (Countdown to start).</li>
              <li>ጎማ ይዞራል (Wheel spins) → አሸናፊ ይፈርማል (Winner determined).</li>
              <li>ክፍያ በራስ-ሰር ይሄዳል (Payout is processed automatically).</li>
            </ul>
          </Section>

          <Section title="መመኪያዎች (Tips)">
            <ul className="pl-5 marker:text-amber-300 list-disc">
              <li>ዝቅተኛ ተጫዋች 2 ነው (Minimum players: 2).</li>
              <li>ከሞላ በኋላ ጨዋታው በራስ-ሰር ይጀምራል (Auto starts when ready).</li>
              <li>የቤት ክፍል 10% ነው (House edge: 10%).</li>
            </ul>
          </Section>

          <div className="text-[11px] text-cyan-200">
            Note: English translations are provided in parentheses for clarity.
          </div>
        </div>
      </div>
    </div>
  )
}

export default RulesModal
