#ifndef N_PUSH_BUTTON_H
#define N_PUSH_BUTTON_H

#include <QPushButton>

class NPushButton : public QPushButton
{
    Q_OBJECT
public:
    enum TYPE{LAYOUT,PAGE,SCENE,LINK,IMAGE};
    explicit NPushButton(TYPE type, QWidget *parent = 0);
    void setText(const QString &text);
    void setType(const QString &type);

private:
    TYPE mType;

signals:
    void textChanged(const QString &text);

public slots:
    void execListDialog();

};

#endif // N_PUSH_BUTTON_H
