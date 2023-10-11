import {Form, Input, Select, Space} from "antd";
import {FC, ReactNode, useEffect} from "react";

const opTypes = ['Mint', 'Approve', 'Transfer']

export const OP: FC<{
    btn?: ReactNode, id?:string, defaultAddr?: string,
    onValuesChange?: (changedValues: any, allValues: any) => void
}> = ({
          btn, id, defaultAddr,
          onValuesChange
      }) => {

    const [form] = Form.useForm();
    useEffect(()=>{
        const initV = {
            action: opTypes[0],
            address: defaultAddr || '0x1' + '1'.padStart(39, '0'),
            amount: Date.now() % 100, id: id
        };
        form.setFieldsValue(initV)
        onValuesChange && onValuesChange(initV, initV)
    }, [])
    return (
        <>
            <Space>
                <Form onValuesChange={onValuesChange} form={form} layout={'inline'}
                >
                    <Form.Item name={'id'} hidden={true}>
                        <Input hidden/>
                    </Form.Item>
                    <Form.Item label="Action" name="action">
                        <Select options={opTypes.map(op => {
                            return {label: op, value: op}
                        })}
                                style={{width: 100}}
                        />
                    </Form.Item>
                    <Form.Item label="Address" name={'address'}>
                        <Input placeholder=""/>
                    </Form.Item>
                    <Form.Item label="Amount" name={'amount'} tooltip={'Unit is ETH (10^18)'}>
                        <Input placeholder="" style={{width: 60}}/>
                    </Form.Item>
                </Form>
                {btn}
            </Space>
        </>
    )
}