import React, { useEffect, useState } from 'react';

export function FakeCrash() {
  const [isWindows, setIsWindows] = useState(true);

  useEffect(() => {
    // Attempt fullscreen to lock in the realism
    try {
      if (!document.fullscreenElement) {
        document.body.requestFullscreen().catch(e => {
          // It's okay if this fails quietly, it just won't be as immersive
        });
      }
    } catch(e) {}

    // Detect OS for maximum psychological impact
    if (navigator.userAgent.toLowerCase().includes('linux')) {
      setIsWindows(false);
    }
    
    return () => {
      // Exit fullscreen when it unmounts
      if (document.fullscreenElement) {
        try { document.exitFullscreen().catch(()=>{}); } catch(e){}
      }
    };
  }, []);

  if (!isWindows) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black text-white font-mono text-[16px] p-6 overflow-hidden" style={{ cursor: 'none' }}>
        <div>[    3.141592] Kernel panic - not syncing: VANTAGE_CONTAINMENT_BREACH: Entity escalation in module kernel/signal_h</div>
        <div>[    3.141595] CPU: 4 PID: 1337 Comm: kworker/u16:4 Tainted: G        W         6.1.0-18-amd64 #1  Debian 6.1.76-1</div>
        <div>[    3.141596] Hardware name: VANTAGE CORP OBERHEIM-7/NULL, BIOS 1.0.4 04/01/1989</div>
        <div>[    3.141597] Call Trace:</div>
        <div>[    3.141598]  &lt;TASK&gt;</div>
        <div>[    3.141599]  dump_stack_lvl+0x48/0x60</div>
        <div>[    3.141600]  panic+0x118/0x2f0</div>
        <div>[    3.141601]  vantage_escalation_handler+0x8c/0x90</div>
        <div>[    3.141602]  process_one_work+0x1c8/0x3c0</div>
        <div>[    3.141603]  worker_thread+0x4d/0x380</div>
        <div>[    3.141604]  ? rescuer_thread+0x3a0/0x3a0</div>
        <div>[    3.141605]  kthread+0xe9/0x110</div>
        <div>[    3.141606]  ? kthread_complete_and_exit+0x20/0x20</div>
        <div>[    3.141607]  ret_from_fork+0x22/0x30</div>
        <div>[    3.141608]  &lt;/TASK&gt;</div>
        <div>[    3.141609] Kernel Offset: 0x4000000 from 0xffffffff81000000 (relocation range: 0xffffffff80000000-0xffffffffbfffffff)</div>
        <div className="mt-8 animate-pulse text-[#00ff41]">---[ end Kernel panic - not syncing: VANTAGE_CONTAINMENT_BREACH: Neural override detected ]---</div>
      </div>
    );
  }

  // Windows 10/11 BSOD mimic
  return (
    <div className="fixed inset-0 z-[9999] bg-[#0078d7] text-white font-sans p-12 md:p-32 flex flex-col justify-center overflow-hidden" style={{ cursor: 'none' }}>
      <div className="text-[140px] leading-none mb-12">:(</div>
      <h1 className="text-[32px] max-w-4xl leading-tight mb-16 tracking-wide">
        Your PC ran into a problem and needs to restart. We're just collecting some error info, and then we'll restart for you.
      </h1>
      <div className="flex items-center gap-12">
        <div className="text-[28px] font-light">
          100% complete
        </div>
        <div className="border border-white/20 p-2 bg-white flex-shrink-0">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=VANTAGE_CORP_CONTAINMENT_BREACH" className="w-[100px] h-[100px] opacity-90 mix-blend-multiply" alt="QR Code"/>
        </div>
        <div className="text-lg space-y-2 opacity-90 font-light">
          <p>For more information about this issue and possible fixes, visit https://www.windows.com/stopcode</p>
          <p className="pt-2">If you call a support person, give them this info:</p>
          <p>Stop code: VANTAGE_CONTAINMENT_BREACH</p>
        </div>
      </div>
    </div>
  );
}
