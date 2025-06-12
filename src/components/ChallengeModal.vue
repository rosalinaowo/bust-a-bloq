<script>
import { Modal } from 'bootstrap/dist/js/bootstrap.bundle';

export default {
    name: 'ChallengeModal',
    props: ['from', 'timeout'],
    emits: ['accept', 'decline'],
    data() {
        return {
            modal: null,
            countdown: this.timeout
        };
    },
    methods: {
        accept() {
            this.modal.hide();
            this.$emit('accept');
        },
        decline() {
            this.modal.hide();
            this.$emit('decline');
        }
    },
    mounted() {
        const modalElement = document.querySelector('#challengeModal');
        if (modalElement) {
            this.modal = new Modal(modalElement);
            this.modal.show();
            setInterval(() => {
                if (this.countdown <= 0) {
                    this.decline();
                    return;
                }
                this.countdown -= 1000;
            }, 1000);
        }
    }
};
</script>

<template>
    <div id="challengeModal" class="modal fade" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Challenge request</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>{{ from }} challenged you to a game!</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="decline">Decline</button>
                    <button type="button" class="btn btn-primary" @click="accept">Accept ({{ countdown / 1000 }})</button>
                </div>
            </div>
        </div>
    </div>
</template>