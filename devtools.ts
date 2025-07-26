import CDP from 'chrome-remote-interface';

async function main(): Promise<void> {
  const host = '127.0.0.1';
  const port = 8080;

  const targets = await CDP.List({ host, port });

  const target = targets.find(t => t.title.includes('SteamDB'));

  if (!target) {
    console.log('❌ No target found');

    return;
  }

  const client = await CDP({ target, host, port });
  const { Runtime } = client;

  await Runtime.enable(); // ✅ Actually wait for Runtime to be enabled

  Runtime.exceptionThrown(({ exceptionDetails }) => {
    console.log(exceptionDetails);
    console.log('💥 Exception caught:');
    console.log('Message:', exceptionDetails.text);

    if (exceptionDetails.stackTrace?.callFrames) {
      console.log('📚 Stack trace:');
      for (const frame of exceptionDetails.stackTrace.callFrames) {
        console.log(`  at ${frame.functionName || '<anonymous>'} (${frame.url}:${frame.lineNumber + 1}:${frame.columnNumber + 1})`);
      }
    }
  });

  console.log('🧠 Ready to catch errors...');

  // Force an error in the page to test (run in page context)
  await Runtime.evaluate({
    expression: 'setTimeout(() => { throw new Error("Injected Failstorm™️") }, 1000);',
  });

  // Keep the process alive like your last two brain cells
  process.stdin.resume();
}

main().catch((e) => { console.error('💀 Error in main():', e); });
