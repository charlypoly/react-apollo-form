import * as React from 'react';
import { ApolloFormConfig, isMutationConfig, isTruthyWithDefault } from './utils';
import { JSONSchema6 } from 'json-schema';
import { ApolloFormUi } from './component';
import Form, { UiSchema } from 'react-jsonschema-form';


export const titleRenderer = ({ title }: { title: string }) => (
    <h2>{title}</h2>
);

export interface SaveButtonRendererProps {
    save?: () => void;
    isSaved: boolean;
    hasError: boolean;
    isDirty: boolean;
}

export const saveButtonRenderer = (props: SaveButtonRendererProps) => (
    <button
        disabled={!!props.hasError || !props.isDirty}
        onClick={props.save}
    >
        {
            props.isSaved ?
                'Saved' :
                'Save'
        }
    </button>
);

export const cancelButtonRenderer = (props: { cancel?: () => void; }) => (
    <button
        type="button"
        onClick={props.cancel}
    >
        Close
    </button>
);

export interface ButtonsRendererProps {
    cancel?: () => void;
    save?: () => void;
    isSaved: boolean;
    hasError: boolean;
    isDirty: boolean;
}
export const buttonsRenderer = (props: ButtonsRendererProps) => (
    <div>
        {cancelButtonRenderer({ cancel: props.cancel })}
        {
            saveButtonRenderer({
                save: props.save,
                isSaved: props.isSaved,
                isDirty: props.isDirty,
                hasError: props.hasError
            })
        }
    </div>
);

export interface FormRendererProps {
    widgets: object;
    fields: object;
    // tslint:disable-next-line:no-any
    onChange: (data: any) => void;
    // tslint:disable-next-line:no-any
    save: (data: any) => void;
    // tslint:disable-next-line:no-any
    transformErrors: any;
    config: ApolloFormConfig;
    schema: JSONSchema6;
    data: object;
    isDirty: boolean;
    ui?: UiSchema & ApolloFormUi;
    subTitle?: string;
    liveValidate?: boolean;
}

export interface FormContext {
    subTitle?: string;
    isDirty: boolean;
    showErrorsInline: boolean;
    formPrefix: string;
}

export class FormRenderer extends React.Component<FormRendererProps> {
    render() {
        const { props } = this;
        const formContext: FormContext = {
            subTitle: props.subTitle,
            isDirty: props.isDirty,
            showErrorsInline: isTruthyWithDefault(props.ui ? props.ui.showErrorsInline : true, true),
            formPrefix: props.config.name ?
                props.config.name :
                isMutationConfig(props.config) ?
                    props.config.mutation.name :
                    props.config.name!
        };
        return (
            <Form
                liveValidate={isTruthyWithDefault(props.liveValidate, false)}
                schema={props.schema}
                uiSchema={props.ui || {}}
                widgets={props.widgets}
                formContext={formContext}
                fields={props.fields}
                formData={props.data}
                onSubmit={props.save}
                onChange={props.onChange}
                showErrorList={isTruthyWithDefault(props.ui ? props.ui.showErrorsList : false, false)}
                // tslint:disable-next-line:no-any
                {...{ ErrorList: props.ui ? props.ui.errorListComponent : undefined } as any}
                transformErrors={
                    props.transformErrors(formContext.formPrefix)
                }
            >
                {this.props.children}
            </Form>
        );
    }
}
