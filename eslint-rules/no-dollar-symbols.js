/**
 * Custom ESLint Rule: No Dollar Symbols
 * 
 * PayAid V3 Brand Enforcement Rule
 * Prevents use of dollar symbols ($) in code
 * Enforces Indian Rupee (₹) currency only
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow dollar symbols in code. PayAid V3 uses Indian Rupee (₹) only.',
      category: 'PayAid Brand Enforcement',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noDollarSymbol: 'Dollar symbol ($) found. PayAid V3 uses Indian Rupee (₹) only. Use formatINR() or formatINRForDisplay() instead.',
    },
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value === 'string' && /\$[0-9]/.test(node.value)) {
          context.report({
            node,
            messageId: 'noDollarSymbol',
          })
        }
      },
      TemplateLiteral(node) {
        node.quasis.forEach((quasi) => {
          if (quasi.value && /\$[0-9]/.test(quasi.value.raw)) {
            context.report({
              node: quasi,
              messageId: 'noDollarSymbol',
            })
          }
        })
      },
    }
  },
}
