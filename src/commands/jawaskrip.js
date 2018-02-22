import Rin from '../core/rin'
import jawaskrip from 'jawaskrip'

export default class Jawaskrip {
    constructor() {
        this.INFO = {
            command: 'jawaskrip',
            description: 'compile jawaskrip to javascript',
            standarize: false
        }
        this.VARIABLE = {
            codeEmpty: 'empty code!'
        }
    }

    async handle(command) {
        const code = command.join(' ')

        if (Rin.isEmpty(code)) return this.VARIABLE.codeEmpty

        try {
            const result = await jawaskrip.compile(code)

            return Rin.code('js', result)
        } catch (err) {
            return err.message || JSON.stringify(err)
        }
    }
}
