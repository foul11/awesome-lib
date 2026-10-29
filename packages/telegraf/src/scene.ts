import {
    WizardScene as TelegrafWizardScene,
    BaseScene as TelegrafBaseScene,
    Stage as TelegrafStage,
} from 'telegraf/scenes';

import type { Middleware, Context } from 'telegraf';
import type { SceneContextScene, WizardContextWizard } from 'telegraf/scenes';

export type InferSceneNames<
    C extends Context,
> = C extends ContextScene
    ? C['__scene_names']
    : never;

interface SceneSessionData {
    current?: string
    expires?: number
    state?: object
    cursor: number
}

interface SceneSession {
    __scenes?: SceneSessionData
    state?: object
}

export interface SessionContext<
    S extends object,
    SceneNames extends string,
> {
    __scene_names: SceneNames
    session: SceneSession & S
    scene: Omit<SceneContextScene<any, any>, 'enter'> & {
        enter: (sceneId: SceneNames, initialState?: object) => Promise<unknown>
    }
    wizard: WizardContextWizard<any> & {
        next: () => void
        back: () => void
    }
}

interface ContextScene extends Context {
    __scene_names: string
    scene: any
}

interface WizardContextScene extends ContextScene {
    wizard: any
}

type SceneOptionsB<C extends ContextScene> = ConstructorParameters<typeof TelegrafBaseScene<C>>[1];
type SceneOptionsW<C extends WizardContextScene> = ConstructorParameters<typeof TelegrafWizardScene<C>>[1];


export class Stage<C extends ContextScene> extends TelegrafStage<C> {}

export class BaseScene<C extends ContextScene> extends TelegrafBaseScene<C> {
    // Change constructor signature
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor(id: InferSceneNames<C>, options?: SceneOptionsB<C>) {
        super(id, options);
    }
}

export class WizardScene<C extends WizardContextScene> extends TelegrafWizardScene<C> {
    constructor(id: InferSceneNames<C>, ...steps: Array<Middleware<C>>);
    constructor(
        id: InferSceneNames<C>,
        options: SceneOptionsW<C>,
        ...steps: Array<Middleware<C>>
    );
    
    constructor(
        id: InferSceneNames<C>,
        options: SceneOptionsW<C> | Middleware<C>,
        ...steps: Array<Middleware<C>>
    ) {
        super(id, options as any, ...steps);
    }
}
