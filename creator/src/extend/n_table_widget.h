#ifndef N_TABLE_WIDGET_H
#define N_TABLE_WIDGET_H

#include <QTableWidget>

class NTableWidget : public QTableWidget
{
    Q_OBJECT
public:
    explicit NTableWidget(QWidget *parent = 0);

protected:
    virtual void mouseReleaseEvent(QMouseEvent * event);

signals:
    void outOfCellClicked();

public slots:

};

#endif // N_TABLE_WIDGET_H
