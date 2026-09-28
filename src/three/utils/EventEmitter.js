export default class
{
    /**
     * 构造函数
     */
    constructor()
    {
        this.callbacks = {}
        this.callbacks.base = {}
    }

    /**
     * 绑定事件监听器
     */
    on(_names, callback)
    {
        const that = this

        // 错误处理
        if(typeof _names === 'undefined' || _names === '')
        {
            console.warn('wrong names')
            return false
        }

        if(typeof callback === 'undefined')
        {
            console.warn('wrong callback')
            return false
        }

        // 解析事件名
        const names = this.resolveNames(_names)

        // 逐个处理事件名
        names.forEach(function(_name)
        {
            // 解析单个事件名
            const name = that.resolveName(_name)

            // 如果命名空间不存在则创建
            if(!(that.callbacks[ name.namespace ] instanceof Object))
                that.callbacks[ name.namespace ] = {}

            // 如果该事件列表不存在则创建
            if(!(that.callbacks[ name.namespace ][ name.value ] instanceof Array))
                that.callbacks[ name.namespace ][ name.value ] = []

            // 添加回调
            that.callbacks[ name.namespace ][ name.value ].push(callback)
        })

        return this
    }

    /**
     * 解绑事件监听器
     */
    off(_names)
    {
        const that = this

        // 错误处理
        if(typeof _names === 'undefined' || _names === '')
        {
            console.warn('wrong name')
            return false
        }

        // 解析事件名
        const names = this.resolveNames(_names)

        // 逐个处理事件名
        names.forEach(function(_name)
        {
            // 解析单个事件名
            const name = that.resolveName(_name)

            // 删除整个命名空间
            if(name.namespace !== 'base' && name.value === '')
            {
                delete that.callbacks[ name.namespace ]
            }

            // 删除命名空间中的指定事件回调
            else
            {
                // 默认命名空间
                if(name.namespace === 'base')
                {
                    // 尝试在每个命名空间中删除该事件
                    for(const namespace in that.callbacks)
                    {
                        if(that.callbacks[ namespace ] instanceof Object && that.callbacks[ namespace ][ name.value ] instanceof Array)
                        {
                            delete that.callbacks[ namespace ][ name.value ]

                            // 如果命名空间为空则删除
                            if(Object.keys(that.callbacks[ namespace ]).length === 0)
                                delete that.callbacks[ namespace ]
                        }
                    }
                }

                // 指定命名空间
                else if(that.callbacks[ name.namespace ] instanceof Object && that.callbacks[ name.namespace ][ name.value ] instanceof Array)
                {
                    delete that.callbacks[ name.namespace ][ name.value ]

                    // 如果命名空间为空则删除
                    if(Object.keys(that.callbacks[ name.namespace ]).length === 0)
                        delete that.callbacks[ name.namespace ]
                }
            }
        })

        return this
    }

    /**
     * 触发事件
     */
    trigger(_name, _args)
    {
        // 错误处理
        if(typeof _name === 'undefined' || _name === '')
        {
            console.warn('wrong name')
            return false
        }

        const that = this
        let finalResult = null
        let result = null
        // 默认参数
        const args = !(_args instanceof Array) ? [] : _args

        // 解析事件名（这里只应有一个事件）
        let name = this.resolveNames(_name)

        // 解析单个事件名
        name = this.resolveName(name[ 0 ])

        // 默认命名空间
        if(name.namespace === 'base')
        {
            // 遍历所有命名空间查找回调
            for(const namespace in that.callbacks)
            {
                if(that.callbacks[ namespace ] instanceof Object && that.callbacks[ namespace ][ name.value ] instanceof Array)
                {
                    that.callbacks[ namespace ][ name.value ].forEach(function(callback)
                    {
                        result = callback.apply(that, args)

                        if(typeof finalResult === 'undefined')
                        {
                            finalResult = result
                        }
                    })
                }
            }
        }

        // 指定命名空间
        else if(this.callbacks[ name.namespace ] instanceof Object)
        {
            if(name.value === '')
            {
                console.warn('wrong name')
                return this
            }

            that.callbacks[ name.namespace ][ name.value ].forEach(function(callback)
            {
                result = callback.apply(that, args)

                if(typeof finalResult === 'undefined')
                    finalResult = result
            })
        }

        return finalResult
    }

    /**
     * 解析多个事件名
     */
    resolveNames(_names)
    {
        let names = _names
        names = names.replace(/[^a-zA-Z0-9 ,/.]/g, '')
        names = names.replace(/[,/]+/g, ' ')
        names = names.split(' ')

        return names
    }

    /**
     * 解析单个事件名
     */
    resolveName(name)
    {
        const newName = {}
        const parts = name.split('.')

        newName.original  = name
        newName.value     = parts[ 0 ]
        newName.namespace = 'base' // 默认命名空间

        // 指定命名空间
        if(parts.length > 1 && parts[ 1 ] !== '')
        {
            newName.namespace = parts[ 1 ]
        }

        return newName
    }
}
