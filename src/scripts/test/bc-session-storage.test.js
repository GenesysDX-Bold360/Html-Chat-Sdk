var bc = window.bc || {};

describe('bc.SessionStorage.init', function() {

	beforeEach(function() {
		sessionStorage.removeItem('bc');
		bc.config = {messageCache: true};
	});

	it('Should create BoldChat new session storage object', function() {
		var storage = new bc.SessionStorage('1234');
		storage.addMessage('test');
		expect(sessionStorage.bc).toBeDefined();
	});

	it('Should remove invalid storage object', function() {
		sessionStorage.bc = 'Invalid JSON';
		//noinspection Eslint
		var storage = new bc.SessionStorage('1234');
		expect(sessionStorage.bc).toBeUndefined();
	});

	it('Should reset if chat id doesn\'t match', function() {
		sessionStorage.bc = JSON.stringify({
			chat: {
				chatKey: '5678',
				messages: [ 'xyz' ]
			}
		});
		var storage = new bc.SessionStorage('1234');
		expect(storage.getMessages().length).toBe(0);
	});

	it('Config says it should NOT create BoldChat new session storage object', function() {
		bc.config = {messageCache: false};
		var storage = new bc.SessionStorage('1234');
		storage.addMessage('test');
		expect(sessionStorage.bc).toBeUndefined();
	});
});

describe('bc.SessionStorage.addMessage', function() {

	beforeEach(function() {
		sessionStorage.removeItem('bc');
		bc.config = {messageCache: true};
	});

	it('Should save the message to storage', function() {
		var storage = new bc.SessionStorage('1234');
		storage.addMessage('abc 123');
		var stored = JSON.parse(sessionStorage.bc);
		expect(stored.chat.chatKey).toBe('1234');
		expect(stored.chat.messages.length).toBe(1);
	});

	it('Should overwrite the message in storage', function() {
		var storage = new bc.SessionStorage('1234');
		storage.addMessage('123', {MessageID: '123', Text: 'abc 123'});
		storage.addMessage('123', {MessageID: '123', Text: 'abc xyz'});
		var stored = JSON.parse(sessionStorage.bc);
		expect(stored.chat.messages.length).toBe(1);
		expect(stored.chat.messages[0].MessageID).toBe('123');
		expect(stored.chat.messages[0].Text).toBe('abc xyz');
	});

	it('Should overwrite the message loaded from storage', function() {
		var storage = new bc.SessionStorage('1234');
		storage.addMessage('123', {MessageID: '123', Text: 'abc 123'});
		storage = new bc.SessionStorage('1234');
		storage.addMessage('123', {MessageID: '123', Text: 'abc xyz'});
		var stored = JSON.parse(sessionStorage.bc);
		expect(stored.chat.messages.length).toBe(1);
		expect(stored.chat.messages[0].MessageID).toBe('123');
		expect(stored.chat.messages[0].Text).toBe('abc xyz');
	});

	it('Config says it should should NOT save the message to storage', function() {
		var originalConfig = bc.config;
		bc.config = {messageCache: false};
		var storage = new bc.SessionStorage('1234');
		storage.addMessage('abc 123');
		var stored = sessionStorage.bc;
		expect(stored).toBeUndefined();
		bc.config = originalConfig;
	});
});

describe('bc.SessionStorage.getLastMessageId', function() {
	it('Should say the latest message was last message id', function() {
		var storage = new bc.SessionStorage('1234');
		storage.addMessage('123', {MessageID: '123', Created: new Date(), Text: 'hello world'});
		storage.addMessage('456', {MessageID: '456', Created: new Date(), Text: 'foo bar'});
		var stored = JSON.parse(sessionStorage.bc);
		expect(stored.lastMessageId).toBeUndefined('456');
	});
});

describe('bc.SessionStorage.getMessages', function() {

	beforeEach(function() {
		sessionStorage.removeItem('bc');
		bc.config = {messageCache: true};
	});

	it('Should get messages from storage', function() {
		sessionStorage.bc = JSON.stringify({
			chat: {
				chatKey: '1234',
				messages: [ 'xyz' ]
			}
		});
		var storage = new bc.SessionStorage('1234');
		var messages = storage.getMessages();
		expect(messages[0]).toBe('xyz');
	});
});
