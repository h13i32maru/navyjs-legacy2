#include "n_tree_widget.h"

NTreeWidget::NTreeWidget(QWidget *parent) : QTreeWidget(parent)
{
}

void NTreeWidget::dropEvent(QDropEvent *event) {
    QTreeWidget::dropEvent(event);

    if (event->isAccepted()) {
        emit changedTreeByDrop();
    }
}
