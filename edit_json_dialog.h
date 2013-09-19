#ifndef EDIT_JSON_DIALOG_H
#define EDIT_JSON_DIALOG_H

#include <QDialog>

namespace Ui {
class EditJsonDialog;
}

class EditJsonDialog : public QDialog
{
    Q_OBJECT

public:
    explicit EditJsonDialog(QWidget *parent = 0);
    void setJsonText(QString text);
    ~EditJsonDialog();

private:
    Ui::EditJsonDialog *ui;
};

#endif // EDIT_JSON_DIALOG_H
