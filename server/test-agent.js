import 'dotenv/config';
import { runInterviewAgent } from './src/services/agent.service.js';

const test = async () => {
  try {
    console.log('=== Testing Chat Agent ===');
    
    // Message 1
    console.log('Sending first message: "hi"');
    const res1 = await runInterviewAgent({
      message: 'hi',
      conversationHistory: [{ role: 'user', content: 'hi' }],
      currentSections: {},
      resumeId: '65f123456789012345678901', // Dummy ID
      targetRole: 'Software Engineer',
    });
    console.log('Agent Response 1:', res1);

    // Message 2
    console.log('\nSending second message: "I want to add experience at Google"');
    const res2 = await runInterviewAgent({
      message: 'I want to add experience at Google',
      conversationHistory: [
        { role: 'user', content: 'hi' },
        { role: 'assistant', content: res1.message },
        { role: 'user', content: 'I want to add experience at Google' }
      ],
      currentSections: {},
      resumeId: '65f123456789012345678901',
      targetRole: 'Software Engineer',
    });
    console.log('Agent Response 2:', res2);

    process.exit(0);
  } catch (error) {
    console.error('Agent test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

test();
