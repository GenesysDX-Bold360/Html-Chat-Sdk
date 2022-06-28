declare namespace bc {
  export interface Client {
    ClientID: string;
    ClientTimeout: number;
  }

  export class ApiFrame {
    constructor(accountId, frame, serverSet);

    initialize(): void;

    initFrame(frame, frameOrigin, accountId): HTMLElement;

    setMessageListener(listener): void;

    call(method, params, skipRetry): Rpc;

    openStream(client: Client): void;

    closeStream(): void;

    tryReconnect(): void;

    destroy(): void;

    private _receiveApiMessage(event): void;

    private _callRestObj(rest, tries): Rpc;
  }

  export function subscriber(subscriberObject, events)

  export class Rpc {
    /* subscriber methods */
    subscribe(name, callback): Rpc;

    unsubscribe(name, callback): Rpc;

    fireEvent(eventName, ...args): Rpc;

    /* End of subscriber methods */

    finished(response: any);

    success(handler: (message: any) => void): Rpc;

    failure(handler: (message: any) => void): Rpc;
  }

  export class RpcError {
    constructor(message: string);

    success(handler: (message: string) => void): RpcError;

    failure(handler: (message: string) => void): RpcError;
  }

  export interface ChatMessage {
    MessageID: string;
    Created: string;
  }

  export interface People {
    PersonID: string;
    Name: string;
    Avatar: string;
  }

  export type State = 'create' | 'prechat' | 'started' | 'postchat' | 'unavailable' | 'unavailable_submitted' | 'done';

  export class VisitorClient {
    ClientTimeout: number;
    chatContainsStatusMessage: boolean;

    constructor(auth: string);

    createAuthParamParts(auth: string): { parts: string[]; aid: string };

    assembleAuthParamByAuthorizationType(auth: string): { auth: string; aid: string; serverSet: string };

    initializeAsync(): AsyncValue;

    canStartChat(done: () => void): void;

    hasChatKey(): boolean;

    isResumingChat(): boolean;

    getChatParams(): { [key: string]: any };

    addChatParams(data: { [key: string]: any }): void;

    setChatWindowSettings(data: { [key: string]: any }): void;

    getChatWindowSettings(): { [key: string]: any };

    getVisitInfo(): { [key: string]: any };

    addVisitInfo(data: { [key: string]: any }): void;

    updateVisitInfo(data: { [key: string]: any }): void;

    getMessages(): ChatMessage[];

    getPerson(personId: string): People;

    getChat(): any;

    getPostChatFormIfAvail(): void;

    getLastMessageId(): string;

    isMinimized(): boolean;

    changeMinimizedStatus(isMinimized: boolean): void;

    getChatAvailability(visitorId: string): Rpc;

    createChat(visitorID, language, skipPreChat, data, secured, button, url, customUrl): AsyncValue;

    cancelPreChat(): void;

    cancelChat(): void;

    deleteSessionData(): void;

    submitUnavailableEmail(from, subject, body): Rpc | RpcError;

    submitPreChat(data: { [key: string]: any }): Rpc | RpcError;

    changeLanguage(language: string): Rpc | RpcError;

    startChat(): Rpc | RpcError;

    visitorTyping(isTyping): Rpc | RpcError;

    sendMessage(name, message, messageId): Rpc | RpcError;

    emailChatHistory(email: string): Rpc | RpcError;

    finishChat(skipPostChat: boolean): Rpc | RpcError;

    getUnavailableForm(): Rpc | RpcError;

    acceptActiveAssist(): Rpc | RpcError;

    declineActiveAssist(): Rpc | RpcError;

    cancelActiveAssist(): Rpc | RpcError;

    acceptRemoteControl(): void;

    declineRemoteControl(): void;

    cancelRemoteControl(): void;

    submitPostChat(data: { [key: string]: any }): Rpc | RpcError;

    getState(): State;

    isStarted(): boolean;

    setState(overrideState: State): void;

    getBrandings(): any;

    getLanguage(): string;

    sendFile(file, onSuccess, onError, onProgress): void;

    setEmailTranscript(emailAddress: string): Rpc | RpcError;

    shutdown(): void;

    /* subscriber methods */
    subscribe(name, callback: (...args) => void): VisitorClient;

    unsubscribe(name, callback: (...args) => void): VisitorClient;

    fireEvent(eventName, ...args): VisitorClient;

    /* End of subscriber methods */

    /* Events */
    updateChat(callback: (...args) => void): VisitorClient;

    updateTyper(callback: (...args) => void): VisitorClient;

    addMessage(callback: (...args) => void): VisitorClient;

    autoMessage(callback: (...args) => void): VisitorClient;

    updateBusy(callback: (...args) => void): VisitorClient;

    beginActiveAssist(callback: (...args) => void): VisitorClient;

    resumeActiveAssist(callback: (...args) => void): VisitorClient;

    updateActiveAssist(callback: (...args) => void): VisitorClient;

    remoteControlMessage(callback: (...args) => void): VisitorClient;

    beginRemoteControl(callback: (...args) => void): VisitorClient;

    reconnecting(callback: (...args) => void): VisitorClient;

    reconnected(callback: (...args) => void): VisitorClient;

    heartbeat(callback: (...args) => void): VisitorClient;

    sendMessageFailure(callback: (...args) => void): VisitorClient;

    sendMessageSuccess(callback: (...args) => void): VisitorClient;

    chatEndedByOp(callback: (...args) => void): VisitorClient;

    chatEnded(callback: (...args) => void): VisitorClient;

    closed(callback: (...args) => void): VisitorClient;

    /* End of Events */
  }

  export type ConnectionState = 'connecting';

  export class Session {
    chatWindowSettings: any;
    viewManager: ViewManager;
    client: VisitorClient;
    chatParams: any;
    visitorInfo: any;
    lastSuccesfullInteraction: any;
    heartbeatTimeout: any;
    connectionState: ConnectionState;

    constructor(apiKey, chatParams, visitorInfo, viewManager, enforceCreateChat);

    getApiKey(): string;

    initializeAsync(): AsyncValue;

    getVisitorId(): string;

    getChatAvailability(onChatAvailability, onChatAvailabilityFailed): void;

    startChat(skipPreChat, language, data): AsyncValue;

    setLanguage(language): void;

    setVisitorTyping(isTyping): void;

    addVisitorMessage(message): string;

    setEmailTranscript(emailAddress): void;

    cancelQueueWait(): void;

    endChat(): void;

    getVisitorName(): string;

    getOperatorName(): string;

    minimizeChat(): void;

    changeMinimizedStatus(): void;

    isMinimized(): boolean;

    subscribeToClientEvents(): void;

    unsubscribeFromClientEvents(): void;

    destroy(): void;
  }

  export class Localizer {
    constructor(localizationValues);

    hasLocalizedValues(): boolean;

    isLanguageRTL(): boolean;

    setLocalizationValues(values, languageCode): void;

    getLanguage(): string;

    getLocalizedValue(key: string): string;

    updateLocalizedValues(rootElement): void;
  }

  export interface FormItem {
    ElementId: string;
    Required: boolean;
    Label: string;
    LabelKey: string;
    ValidationKeyGroup: string;
    ValidationFunc: () => boolean;
  }

  export interface FormInstance {
    form: HTMLElement;
    formItems: FormItem[];
    setFormLanguage: (languageCode: string) => void;
  }

  export class FormBuilder {
    constructor(localizer: bc.Localizer);

    createPlaceholder(e, placeholder, placeholderKey, placeholderSuffix): HTMLElement;

    createErrorForm(introKey, messageContent): HTMLElement;

    createSelectOptions(selectElem, data): HTMLElement | undefined;

    createForm(introKey, dataDefinition, invalidFormKey, submitKey, submitCallback, languageChangeCallback, topField, topFieldKey, requiredFieldLabelSuffix): FormInstance;

    changeDepartments(departments, createdForm, languageCode): void;
  }

  export interface QueueIndicator {
    Position: number;

    UnavailableFormEnabled: boolean;
  }

  export class SessionStorage {
    constructor(chatKey: string);

    addMessage(messageId: string, message: ChatMessage);

    getLastMessageId(): string;

    getMinimizedStatus(): boolean;

    changeMinimizedStatus(isMinimized: boolean): void;

    getMessages(): ChatMessage[];

    getChatParams(): any;

    addChatParams(data: any): void;

    getVisitInfo(): any;

    addVisitInfo(data: any): void;

    getQueueIndicator(): QueueIndicator;

    setQueueIndicator(queueIndicator: QueueIndicator): void;

    setBrandings(brandings: any, languageCode: string): void;

    getBrandings(): any;

    getLanguage(): string;

    setPeople(people: People): void;

    getPeople(): People;

    setClientData(data: any): void;

    getClientData(): any;

    setChatWindowSettings(data: any): void;

    getChatWindowSettings(): any;
  }

  export interface DepartmentList {
    Key: string;
    ShowDepartmentStatus: boolean;
    Options: {
      Value: string;
      Name: string;
      AvailableLabel: string;
      AvailableLabelBranding: string;
    };
  }

  export class ViewManager {
    localizer: Localizer;
    formBuilder: FormBuilder;
    session: Session;
    createdForm: FormInstance;

    constructor(formBuilder: FormBuilder);

    setLocalizationValues(localizationValues: any, languageCode: string): void;

    changeDepartments(departments: DepartmentList, languageCode: string): void;

    getLocalizedValue(key: string): string;

    showBusy(): void;

    hideBusy(): void;

    showForm(introLocKey, formDef, invalidFormLocKey, submitLocKey, submitCallback, topField, topFieldLocKey, clearContainer): void;

    hideForm(): void;

    showChatForm(): void;

    hideMessages(): void;

    hideChatInteraction(): void;

    hideCloseButton(): void;

    showCloseButton(): void;

    showStatusMessage(statusMessageValue: string): void;

    hideStatusMessage(): void;

    messageDelivered(messageId: string, isDelivered: boolean): void;

    showConfirmationDialog(dialogParams: { prompt: string; confirm: string; cancel: string }, callback: (confirmed: boolean) => void): void;

    showCancellableMessage(messageText: string, cancelText: string, cancelCallback: () => void): void;

    hideCancellableMessage(): void;

    showOrUpdateQueueMessage(queuePosition: number, cancelEnabled: boolean): void;

    hideQueueMessage(): void;

    notifyMinimizeButton(): any;

    minimizeChat(): void;

    setOperatorTyping(operatorName: string, operatorAvatar: string, operatorId: string): void;

    clearOperatorTypers(): void;

    hideOperatorTyping(operatorId: string): void;

    initializeMessageElement(messageElement, messageId, personType, time, avatar, name): HTMLElement;

    addOrUpdateMessage(messageId, personType, name, time, message, avatar, isReconstitutedMsg, originalText): void;

    scrollToBottom(lastElementAdded: HTMLElement, callback: () => void): void;

    closeChat(force?: boolean): void;

    showError(message: string): void;

    initialize(session: Session): void;
  }

  export class AsyncValue {
    success(handler: (message: any) => void): AsyncValue;

    failure(handler: (message: any) => void): AsyncValue;

    resolve(message: any);

    reject(message: any);

    /* subscriber methods */
    subscribe(name, callback): AsyncValue;

    unsubscribe(name, callback): AsyncValue;

    fireEvent(eventName, ...args): AsyncValue;

    /* End of subscriber methods */

    static resolve(message: any): AsyncValue;

    static all(arr: AsyncValue[]): AsyncValue;
  }

  export namespace util {
    export function createCookie(name: string, value: string, days: number, domain: string): boolean;

    export function readCookie(name: string): AsyncValue;

    export function readRawCookie(name: string): AsyncValue;

    export function eraseCookie(name: string): boolean;

    export function isDebugEnabled(): boolean;

    export function log(message: any, isError?: boolean, obj?: any): void;

    export function createElement(elementName: string, attributes: any, textValue?: string): HTMLElement;

    export function getAbsPathFromRelative(winLocation, relativePath): string;

    export function loadJavascript(element: HTMLElement, callback: () => void): void;

    export function getId(): string;

    export function base64(s: string): string;

    export function isNodeList(nodes: Node | NodeList): boolean;

    export function addClass(element: Node | NodeList, className: string): void;

    export function removeClass(element: Node | NodeList, className: string): void;

    export function hasClass(element: Node | NodeList, className: string): boolean;

    export function toggleVisibility(element: Node | NodeList, show: boolean): void;

    export function toggleClass(element: Node, className: string, state: boolean, forceClassName: boolean);

    export function closest(element: HTMLElement, selector: string): HTMLElement | null;

    export function addEventListener(element: HTMLElement, eventName: string, callBack: (node: Node, e: any) => any): void;

    export function removeElement(element: Node | NodeList): void;

    export function getHeight(element: Node | NodeList): number;

    export function setText(element: Node | NodeList, text: string): void;

    export function setHtml(element: Node | NodeList, htmlValue: string): void;

    export function setAttribute(element: Node | NodeList, attributeName: string, attributeValue: string): void;

    export function setStyle(element: Node | NodeList, styleName: string, styleValue: string): void;

    export function checkIsIos(): boolean;

    export function checkIsMobile(): boolean;

    export function msieversion(): number;

    export function objectAssign(target: any, source: any): any;

    export function subscribeToWindowEvent(eventName: string, eventHandler: (target: Window, e: any) => any): void;

    export function unsubscribeFromWindowEvent(eventName: string, eventHandler: (target: Window, e: any) => any): void;
  }
}
