
import { Command } from 'commander';

export function registerCompletionCommand(program: Command) {
  program
    .command('completion')
    .description('Generate shell completion script')
    .argument('[shell]', 'Shell to generate completion for (bash, zsh, fish)', 'bash')
    .action((shell) => {
      const completionScript = generateCompletionScript(shell, program);
      console.log(completionScript);
    });
}

function generateCompletionScript(shell: string, _program: Command): string {
    // Basic completion script generation.
    // In a production environment with `commander`, we might use `omelette` or `tabtab`
    // but `commander` has no built-in "output completion script" feature out of the box for all shells
    // except for its own internal structure.

    // However, to be "cool" and robust like the user asked, we can use a library or
    // construct a simple script that delegates to the binary.

    // Given the constraints and the desire for a simple "source <(...)"
    // I will generate a basic script based on the current program structure.
    // For a robust solution, I will use a template approach.

    if (shell === 'bash') {
        return `
###-begin-coherence-completion-###
#
# coherence command completion script
#
# Installation: coherence completion >> ~/.bashrc
#    or coherence completion >> ~/.bash_profile on OSX.
#
_coherence_completion() {
    local cur prev opts
    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"
    opts="export help completion"

    case "\${prev}" in
        export)
            COMPREPLY=( $(compgen -W "--provider --input --output --tag --no-tag --help" -- \${cur}) )
            return 0
            ;;
        --provider|-p)
            COMPREPLY=( $(compgen -W "claude chatgpt" -- \${cur}) )
            return 0
            ;;
        *)
            ;;
    esac

    COMPREPLY=( $(compgen -W "\${opts}" -- \${cur}) )
    return 0
}

complete -F _coherence_completion coherence
###-end-coherence-completion-###
`;
    } else if (shell === 'zsh') {
        return `
#compdef coherence

_coherence() {
    local -a commands
    commands=(
        'export:Export conversations from CLI'
        'completion:Generate shell completion script'
        'help:Display help for command'
    )

    _arguments -C \\
        '1: :_describe -t commands "coherence command" commands' \\
        '*::arg:->args'

    case $state in
        args)
            case $line[1] in
                export)
                    _arguments \\
                        '(-p --provider)'{-p,--provider}'[Provider type]:provider:(claude chatgpt)' \\
                        '(-i --input)'{-i,--input}'[Input file, directory, or zip path]:input:_files' \\
                        '(-o --output)'{-o,--output}'[Output directory]:output:_files -/' \\
                        '--tag[Enable AI tagging]' \\
                        '--no-tag[Disable AI tagging]' \\
                        '--help[Display help]'
                    ;;
            esac
            ;;
    esac
}

`;
    } else if (shell === 'fish') {
         return `
function __fish_coherence_needs_command
    set cmd (commandline -opc)
    if [ (count $cmd) -eq 1 ]
        return 0
    end
    return 1
end

complete -f -c coherence -n '__fish_coherence_needs_command' -a export -d 'Export conversations from CLI'
complete -f -c coherence -n '__fish_coherence_needs_command' -a completion -d 'Generate shell completion script'
complete -f -c coherence -n '__fish_coherence_needs_command' -a help -d 'Display help for command'

complete -f -c coherence -n '__fish_seen_subcommand_from export' -s p -l provider -r -a "claude chatgpt" -d 'Provider type'
complete -f -c coherence -n '__fish_seen_subcommand_from export' -s i -l input -r -d 'Input file, directory, or zip path'
complete -f -c coherence -n '__fish_seen_subcommand_from export' -s o -l output -r -d 'Output directory'
complete -f -c coherence -n '__fish_seen_subcommand_from export' -l tag -d 'Enable AI tagging'
complete -f -c coherence -n '__fish_seen_subcommand_from export' -l no-tag -d 'Disable AI tagging'
`;
    }

    return '# Shell not supported for auto-generation. Supported: bash, zsh, fish';
}
