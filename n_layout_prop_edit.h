#ifndef N_LAYOUT_PROP_EDIT_H
#define N_LAYOUT_PROP_EDIT_H

#include <QWidget>

namespace Ui {
class NLayoutPropEdit;
}

class NLayoutPropEdit : public QWidget
{
    Q_OBJECT

public:
    explicit NLayoutPropEdit(QWidget *parent = 0);
    ~NLayoutPropEdit();

private:
    Ui::NLayoutPropEdit *ui;
};

#endif // N_LAYOUT_PROP_EDIT_H
