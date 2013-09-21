#ifndef N_TREE_VIEW_H
#define N_TREE_VIEW_H

#include <QTreeView>

class NTreeView : public QTreeView
{
    Q_OBJECT
public:
    explicit NTreeView(QWidget *parent = 0);

protected:
    virtual void dropEvent(QDropEvent * event);

signals:
    void dropped(QString dropDirPath, QString selectedFilePath);

public slots:

};

#endif // N_TREE_VIEW_H
