#ifndef N_TREE_WIDGET_H
#define N_TREE_WIDGET_H

#include <QTreeWidget>
#include <QDropEvent>

class NTreeWidget : public QTreeWidget
{
    Q_OBJECT
public:
    explicit NTreeWidget(QWidget *parent = 0);

protected:
    virtual void dropEvent(QDropEvent * event);

signals:
    void changedTreeByDrop(QTreeWidgetItem *droppedItem);

public slots:

};

#endif // N_TREE_WIDGET_H
