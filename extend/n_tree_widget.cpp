#include "n_tree_widget.h"
#include <QDebug>

NTreeWidget::NTreeWidget(QWidget *parent) : QTreeWidget(parent)
{
}

/*
 * 要素がドロップされてツリーの内容が変わったことを
 * シグナルとして送信するためにオーバーライドしている.
 */
void NTreeWidget::dropEvent(QDropEvent *event) {
    QTreeWidgetItem * droppedItem = currentItem();
    QTreeWidget::dropEvent(event);

    if (event->isAccepted()) {
        emit changedTreeByDrop(droppedItem);
    }
}
