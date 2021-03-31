import type {
    JSONSchema4
} from 'json-schema';
import type {SchemaNode as AmisSchema, Schema} from 'amis/lib/types';
import {schemaGenerator} from './schema-generator';

class AmisSchema2JsonSchemaCompiler {
    run(schema: Schema): Pick<JSONSchema4, 'properties' | 'required'>{
        return this.compileFormOrCombo(schema);
    }

    // 有些 controls 内部使用 FieldSet 等套了一层
    // 需要把他们打平
    flatControls(controls: Schema[]) {
        let i = 0;
        while (i < controls.length) {
            const control = controls[i];
            if (control.type === 'fieldSet') {
                controls.splice(i, 1, ...control.controls);
                i += control.controls.length;
                continue;
            }
            if (control.type === 'grid') {
                controls.splice(i, 1, ...control.columns);
                i += control.columns.length;
                continue;
            }
            i++;
        }
    }

    // TODO：
    // formula 用到的变量内容，提交的时候不会包含
    // 需要在这里遍历一边 controls，遇到 formula 之后
    // 解析表达式，找到所有变量，删除这些变量
    processFormula(controls: Schema[]) {

    }

    compileFormOrCombo(schema: Schema): Pick<JSONSchema4, 'properties' | 'required'>{
        const controls = schema.controls;
        if (!controls) {
            return {};
        }

        const res = schemaGenerator.createObject();

        // 预处理
        this.flatControls(controls);
        // this.processFormula(controls);

        controls.forEach((item: Schema) => {
            if (item.required) {
                res.required.push(item.name);
            }

            res.properties[item.name] = this.control2property(item);
        });

        return res;
    }

    control2property(control: Schema): JSONSchema4 {

        switch (control.type) {
            case 'array': {
                return this.compileArray(control);
            }
            case 'checkbox': {
                return this.compileCheckbox(control);
            }
            case 'combo': {
                return this.compileFormOrCombo(control);
            }

            // 容器
            case 'container': {
                return this.control2property(control.body);
            }

            // 字符串
            case 'checkboxes':
            case 'city':
            case 'color':
            case 'chained-select':
            case 'date':
            case 'date-range':
            case 'editor': {
                return this.compileToString(control);
            }
            case 'Grid': {
                break;
            }
            case 'Group': {
                break;
            }
            case 'HBox': {
                break;
            }
            case 'Hidden': {
                break;
            }
            case 'IconPickerIcons': {
                break;
            }
            case 'IconPicker': {
                break;
            }
            case 'Image': {
                break;
            }
            case 'index': {
                break;
            }
            case 'InputGroup': {
                break;
            }
            case 'Item': {
                break;
            }
            case 'List': {
                break;
            }
            case 'Location': {
                break;
            }
            case 'Matrix': {
                break;
            }
            case 'NestedSelect': {
                break;
            }
            case 'Number': {
                break;
            }
            case 'Options': {
                break;
            }
            case 'Panel': {
                break;
            }
            case 'Picker': {
                break;
            }
            case 'Radios': {
                break;
            }
            case 'Range': {
                break;
            }
            case 'Rating': {
                break;
            }
            case 'Repeat': {
                break;
            }
            case 'RichText': {
                break;
            }
            case 'Select': {
                break;
            }
            case 'Service': {
                break;
            }
            case 'Static': {
                break;
            }
            case 'SubForm': {
                break;
            }
            case 'Switch': {
                break;
            }
            case 'Table': {
                break;
            }
            case 'TabsTransfer': {
                break;
            }
            case 'Tabs': {
                break;
            }
            case 'Tag': {
                break;
            }
            case 'Textarea': {
                break;
            }
            case 'Text': {
                break;
            }
            case 'Transfer': {
                break;
            }
            case 'TreeSelect': {
                break;
            }
            case 'Tree': {
                break;
            }
        }

        throw Error(control.type + 'is not handled!');
    }

    compileArray(schema: Schema) {
        const res = schemaGenerator.createArray();

        const items = schema.items;
        
        if (Array.isArray(items)) {
            throw Error('Array items is not support in array type.');
        }
        if (!items) {
            throw Error('Array item is not specified.');
        }

        res.items = this.control2property(items);

        return res;
    }

    compileCheckbox(schema: Schema) {
        if (schema.trueValue && schema.falseValue) {
            let type = typeof schema.trueValue;

            if (type === 'string') {
                return this.compileToString(schema);
            }
            else if (type === 'number') {
                return this.compileToNumber(schema);
            }
            else if (type === 'boolean') {
                return this.compileToBoolean(schema);
            }

            throw Error('Unsupported checkbox value type: ' + type);
        }

        return this.compileToBoolean(schema);
    }

    // 下面的是一些通用逻辑，有些类型不需要单独处理
    // 只生成对应类型的 schema 就行了
    compileToString(schema: Schema) {
        return schemaGenerator.createString();
    }

    compileToNumber(schema: Schema) {
        return schemaGenerator.createNumber();
    }

    compileToBoolean(schema: Schema) {
        return schemaGenerator.createBoolean();
    }
}

export function amisSchema2JsonSchema(schema: AmisSchema): JSONSchema4 {
    if (typeof schema !== 'object' || Array.isArray(schema)) {
        throw new Error('amisSchema2JsonSchema 只支持 object 转换');
    }

    if (schema.type !== 'form') {
        throw new Error('根节点的类型需要为 form');
    }

    const compiler = new AmisSchema2JsonSchemaCompiler();

    const {properties, required} = compiler.run(schema);

    return {
        title: schema.title,
        $schema: 'http://json-schema.org/schema#',
        type: 'object',
        properties,
        required
    };
}